// socket-server.js
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Redis = require("ioredis");
const { createAdapter } = require("@socket.io/redis-adapter");
const mongoose = require("mongoose");
const { User, Conversation, Message } = require("./models");

// Redis client setup for scaling WebSockets across multiple servers
const setupSocketServer = (server) => {
  // Redis setup for Socket.io adapter
  const pubClient = new Redis(process.env.REDIS_URI);
  const subClient = pubClient.duplicate();

  // Initialize Socket.io with Redis adapter
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000, // How long to wait before considering connection closed
    pingInterval: 25000, // How often to ping clients
  });

  // Set up Redis adapter for horizontal scaling
  io.adapter(createAdapter(pubClient, subClient));

  // Presence channel for tracking online users
  const presenceChannel = "presence:";

  // Active users map (userId -> socket.id)
  const activeUsers = new Map();

  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.userId) {
        return next(new Error("Invalid token"));
      }

      // Store user ID in socket for later use
      socket.userId = decoded.userId;

      // Fetch user from database
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      // Add user data to socket
      socket.user = user;

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return next(new Error("Token expired"));
      }
      return next(new Error("Authentication failed"));
    }
  });

  // Handle socket connections
  io.on("connection", async (socket) => {
    const userId = socket.userId;

    console.log(`User connected: ${userId}`);

    try {
      // Update user's online status
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      // Add to active users map
      activeUsers.set(userId, socket.id);

      // Publish presence update to Redis
      pubClient.publish(
        `${presenceChannel}${userId}`,
        JSON.stringify({
          userId,
          isOnline: true,
          lastSeen: null,
        })
      );

      // Join user's conversation rooms
      await joinUserConversations(socket);

      // Notify friends or contacts that user is online
      await notifyUserOnline(socket);

      // Handle user events
      setupUserEvents(socket);
    } catch (error) {
      console.error("Error in socket connection:", error);
      socket.emit("error", { message: "Failed to initialize connection" });
    }
  });

  // Helper function to join user's conversations
  const joinUserConversations = async (socket) => {
    try {
      // Find all conversations user is a member of
      const conversations = await Conversation.find({
        members: socket.userId,
      }).select("_id");

      // Join each conversation's room
      for (const conversation of conversations) {
        const roomId = `conversation:${conversation._id}`;
        socket.join(roomId);
        console.log(`User ${socket.userId} joined room ${roomId}`);
      }

      // Also join user's personal room for direct messages
      socket.join(`user:${socket.userId}`);
    } catch (error) {
      console.error("Error joining user conversations:", error);
      socket.emit("error", { message: "Failed to load conversations" });
    }
  };

  // Notify user's contacts that they are online
  const notifyUserOnline = async (socket) => {
    try {
      // Find conversations to identify contacts/friends
      const conversations = await Conversation.find({
        type: "private",
        members: socket.userId,
      });

      // Get unique list of other members
      const contactIds = new Set();
      conversations.forEach((convo) => {
        convo.members.forEach((member) => {
          if (member.toString() !== socket.userId) {
            contactIds.add(member.toString());
          }
        });
      });

      // Emit presence update to all contacts
      const presenceUpdate = {
        userId: socket.userId,
        isOnline: true,
        lastSeen: null,
      };

      // Publish to Redis for other socket instances
      contactIds.forEach((contactId) => {
        // Emit to contact's user room
        io.to(`user:${contactId}`).emit("presence_update", presenceUpdate);
      });
    } catch (error) {
      console.error("Error notifying contacts of online status:", error);
    }
  };

  // Set up all socket event handlers for a user
  const setupUserEvents = (socket) => {
    // Handle joining specific conversation
    socket.on("join_conversation", async (conversationId) => {
      try {
        // Verify user is a member of this conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          members: socket.userId,
        });

        if (!conversation) {
          return socket.emit("error", {
            message: "Conversation not found or access denied",
          });
        }

        const roomId = `conversation:${conversationId}`;
        socket.join(roomId);

        console.log(
          `User ${socket.userId} joined conversation ${conversationId}`
        );

        // Let others know user is active in this conversation
        socket.to(roomId).emit("user_active", {
          userId: socket.userId,
          conversationId,
        });
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Handle leaving specific conversation
    socket.on("leave_conversation", (conversationId) => {
      const roomId = `conversation:${conversationId}`;
      socket.leave(roomId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);

      // Let others know user is no longer active in this conversation
      socket.to(roomId).emit("user_inactive", {
        userId: socket.userId,
        conversationId,
      });
    });

    // Handle new message
    socket.on("new_message", async (messageData) => {
      try {
        // Validate message data
        if (
          !messageData.conversationId ||
          (!messageData.content && !messageData.attachments?.length)
        ) {
          return socket.emit("error", { message: "Invalid message data" });
        }

        // Verify user can post to this conversation
        const conversation = await Conversation.findOne({
          _id: messageData.conversationId,
          members: socket.userId,
        });

        if (!conversation) {
          return socket.emit("error", {
            message: "Conversation not found or access denied",
          });
        }

        // Create new message
        const newMessage = new Message({
          conversationId: messageData.conversationId,
          sender: socket.userId,
          content: messageData.content || "",
          contentType: messageData.contentType || "text",
          attachments: messageData.attachments || [],
          readBy: [socket.userId], // Sender has read it
          deliveredTo: [socket.userId], // Delivered to sender
        });

        await newMessage.save();

        // Update conversation's lastMessage
        await Conversation.findByIdAndUpdate(messageData.conversationId, {
          lastMessage: newMessage._id,
          updatedAt: new Date(),
        });

        // Populate sender info for frontend
        await newMessage.populate({
          path: "sender",
          select: "username avatar",
        });

        // Broadcast to conversation room
        const roomId = `conversation:${messageData.conversationId}`;
        io.to(roomId).emit("message_received", newMessage);

        // Handle offline notifications
        await handleOfflineNotifications(conversation, newMessage, io);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle message read receipts
    socket.on("message_read", async ({ messageId, conversationId }) => {
      try {
        // Update message in database
        const message = await Message.findOneAndUpdate(
          {
            _id: messageId,
            conversationId,
            readBy: { $ne: socket.userId }, // Only if not already marked as read
          },
          {
            $addToSet: { readBy: socket.userId },
          },
          { new: true }
        );

        if (!message) {
          return; // Message already read or not found
        }

        // Broadcast to conversation
        const roomId = `conversation:${conversationId}`;
        io.to(roomId).emit("message_status_updated", {
          messageId,
          userId: socket.userId,
          status: "read",
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
        socket.emit("error", { message: "Failed to update message status" });
      }
    });

    // Handle typing indicators
    socket.on("typing", (conversationId) => {
      const roomId = `conversation:${conversationId}`;
      socket.to(roomId).emit("user_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on("stop_typing", (conversationId) => {
      const roomId = `conversation:${conversationId}`;
      socket.to(roomId).emit("user_stop_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    // Handle user presence subscription
    socket.on("subscribe_presence", (targetUserId) => {
      // Subscribe to Redis presence channel
      subClient.subscribe(`${presenceChannel}${targetUserId}`);

      // Handle presence updates from Redis
      subClient.on("message", (channel, message) => {
        if (channel === `${presenceChannel}${targetUserId}`) {
          try {
            const presenceData = JSON.parse(message);
            socket.emit("presence_update", presenceData);
          } catch (error) {
            console.error("Error parsing presence data:", error);
          }
        }
      });
    });

    socket.on("unsubscribe_presence", (targetUserId) => {
      subClient.unsubscribe(`${presenceChannel}${targetUserId}`);
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      const userId = socket.userId;
      console.log(`User disconnected: ${userId}`);

      try {
        // Remove from active users map
        activeUsers.delete(userId);

        // Update user's online status
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });

        // Publish presence update to Redis
        pubClient.publish(
          `${presenceChannel}${userId}`,
          JSON.stringify({
            userId,
            isOnline: false,
            lastSeen,
          })
        );

        // Find user's conversations to notify contacts
        const conversations = await Conversation.find({
          type: "private",
          members: userId,
        });

        // Get unique list of other members
        const contactIds = new Set();
        conversations.forEach((convo) => {
          convo.members.forEach((member) => {
            if (member.toString() !== userId) {
              contactIds.add(member.toString());
            }
          });
        });

        // Emit presence update to all contacts
        const presenceUpdate = {
          userId,
          isOnline: false,
          lastSeen,
        };

        contactIds.forEach((contactId) => {
          io.to(`user:${contactId}`).emit("presence_update", presenceUpdate);
        });
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  };

  // Handle offline notifications for new messages
  const handleOfflineNotifications = async (conversation, message, io) => {
    try {
      // Get all offline members of this conversation
      const offlineMembers = await User.find({
        _id: {
          $in: conversation.members,
          $ne: message.sender, // Exclude sender
        },
        isOnline: false,
      }).select("_id deviceTokens");

      if (!offlineMembers.length) return;

      // Format message preview
      let preview = message.content;
      if (!preview && message.attachments.length) {
        // Create preview based on attachment type
        const attachmentType = message.attachments[0].type;
        preview = `[${
          attachmentType.charAt(0).toUpperCase() + attachmentType.slice(1)
        }]`;
      }

      // Truncate preview if too long
      if (preview.length > 50) {
        preview = preview.substring(0, 47) + "...";
      }

      // Get sender name
      const sender = await User.findById(message.sender).select("username");
      const senderName = sender ? sender.username : "Someone";

      // Create notification data
      const notificationData = {
        title: conversation.type === "private" ? senderName : conversation.name,
        body: preview,
        data: {
          type: "new_message",
          conversationId: conversation._id.toString(),
          messageId: message._id.toString(),
          senderId: message.sender.toString(),
        },
      };

      // Queue notifications for each offline user
      for (const member of offlineMembers) {
        // If user has device tokens, send push notifications
        if (member.deviceTokens && member.deviceTokens.length) {
          // In a real implementation, this would send to your notification service
          // e.g. Firebase Cloud Messaging, AWS SNS, etc.
          console.log(
            `Queuing notification for user ${member._id}:`,
            notificationData
          );

          // Example of sending to FCM (Firebase)
          // member.deviceTokens.forEach(device => {
          //   admin.messaging().send({
          //     token: device.token,
          //     notification: {
          //       title: notificationData.title,
          //       body: notificationData.body
          //     },
          //     data: notificationData.data
          //   });
          // });
        }
      }
    } catch (error) {
      console.error("Error sending offline notifications:", error);
    }
  };

  // Return the io instance for external use if needed
  return io;
};

module.exports = { setupSocketServer };
