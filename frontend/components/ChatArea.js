// components/ChatArea.js
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useMessages } from '@/hooks/useMessages';
import { ChevronLeftIcon, DotsVerticalIcon, PhoneIcon, VideoCameraIcon, PhotographIcon, PaperClipIcon, 
  MicrophoneIcon, EmojiHappyIcon, XIcon } from '@heroicons/react/outline';
import { CheckIcon, CheckCircleIcon } from '@heroicons/react/solid';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import { format } from 'date-fns';

export default function ChatArea({ conversation, onBackClick, onProfileClick }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Custom hook to fetch and manage messages
  const { 
    messages, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    sendMessage,
    markAsRead
  } = useMessages(conversation?._id);
  
  // Auto-focus message input when conversation changes
  useEffect(() => {
    messageInputRef.current?.focus();
  }, [conversation?._id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [messages, loading]);
  
  // Handle typing indicators
  useEffect(() => {
    if (!socket || !conversation) return;
    
    // Handle typing events from other users
    const handleTyping = (data) => {
      if (data.conversationId === conversation._id && data.userId !== user._id) {
        // Update typing state for this user
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: true
        }));
        
        // Clear typing indicator after 3 seconds of inactivity
        const timeout = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.userId]: false
          }));
        }, 3000);
        
        // Clean up any existing timeout for this user
        if (typingUsers[data.userId]?.timeout) {
          clearTimeout(typingUsers[data.userId].timeout);
        }
        
        return timeout;
      }
    };
    
    const handleStopTyping = (data) => {
      if (data.conversationId === conversation._id && data.userId !== user._id) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: false
        }));
      }
    };
    
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    
    // Clean up event listeners
    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, conversation, user._id, typingUsers]);
  
  // Mark visible messages as read
  useEffect(() => {
    if (messages.length > 0 && socket && conversation) {
      // Find unread messages not sent by current user
      const unreadMessages = messages.filter(
        msg => !msg.readBy.includes(user._id) && msg.sender !== user._id
      );
      
      // Mark each as read
      unreadMessages.forEach(msg => {
        markAsRead(msg._id);
      });
    }
  }, [messages, socket, conversation, user._id, markAsRead]);
  
  // Get conversation display name
  const getConversationName = () => {
    if (conversation.type === 'group') {
      return conversation.name;
    } else {
      // Find the other user in the conversation
      const otherUser = conversation.members.find(m => m._id !== user._id);
      return otherUser?.username || 'Chat';
    }
  };
  
  // Get conversation online status
  const getConversationStatus = () => {
    if (conversation.type === 'group') {
      return `${conversation.members.length} members`;
    } else {
      const otherUser = conversation.members.find(m => m._id !== user._id);
      if (otherUser?.isOnline) {
        return 'Online';
      } else if (otherUser?.lastSeen) {
        return `Last seen ${format(new Date(otherUser.lastSeen), 'h:mm a')}`;
      } else {
        return 'Offline';
      }
    }
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setIsUploading(true);
    
    // In a real app, you would upload these files to your storage service
    // This is a simplified example
    Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          // Determine file type
          let type = 'file';
          if (file.type.startsWith('image/')) type = 'image';
          if (file.type.startsWith('video/')) type = 'video';
          if (file.type.startsWith('audio/')) type = 'audio';
          
          resolve({
            file,
            preview: e.target.result,
            type,
            name: file.name,
            size: file.size
          });
        };
        reader.readAsDataURL(file);
      });
    }))
    .then(newAttachments => {
      setAttachments(prev => [...prev, ...newAttachments]);
      setIsUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    })
    .catch(error => {
      console.error('Error processing files:', error);
      setIsUploading(false);
    });
  };
  
  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Send typing indicator
  const sendTypingIndicator = () => {
    if (!socket || !conversation) return;
    
    socket.emit('typing', conversation._id);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds
    const timeout = setTimeout(() => {
      socket.emit('stop_typing', conversation._id);
    }, 2000);
    
    setTypingTimeout(timeout);
  };
  
  // Handle message input change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    sendTypingIndicator();
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji.native);
  };
  
  // Handle message submission
  const handleSendMessage = async () => {
    if ((!message.trim() && !attachments.length) || isUploading) return;
    
    // In a real app, you would upload attachments to storage first
    // and then send URLs in the message
    const attachmentData = attachments.map(att => ({
      type: att.type,
      url: att.preview, // In real app, this would be a URL to the uploaded file
      name: att.name,
      size: att.size
    }));
    
    try {
      // Determine content type based on message content and attachments
      let contentType = 'text';
      if (attachments.length && !message.trim()) {
        contentType = attachments[0].type;
      }
      
      await sendMessage({
        content: message.trim(),
        contentType,
        attachments: attachmentData,
        replyTo: replyingTo?._id
      });
      
      // Reset form
      setMessage('');
      setAttachments([]);
      setReplyingTo(null);
      setShowEmojiPicker(false);
      
      // Clear typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        socket.emit('stop_typing', conversation._id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error notification
    }
  };
  
  // Handle key press (send on Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Get active typing users text
  const getTypingText = () => {
    const activeTypingUsers = Object.entries(typingUsers)
      .filter(([id, isTyping]) => isTyping)
      .map(([id]) => {
        const member = conversation.members.find(m => m._id === id);
        return member?.username || 'Someone';
      });
    
    if (activeTypingUsers.length === 0) return '';
    if (activeTypingUsers.length === 1) return `${activeTypingUsers[0]} is typing...`;
    if (activeTypingUsers.length === 2) return `${activeTypingUsers[0]} and ${activeTypingUsers[1]} are typing...`;
    return 'Several people are typing...';
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="h-16 min-h-[4rem] border-b border-gray-200 dark:border-gray-700 
        flex items-center justify-between px-4 bg-white dark:bg-gray-800">
        <div className="flex items-center">
          <button 
            onClick={onBackClick}
            className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
          
          <div 
            className="flex items-center cursor-pointer"
            onClick={onProfileClick}
          >
            <Avatar
              src={conversation.avatar}
              alt={getConversationName()}
              status={conversation.type === 'private' ? 
                conversation.members.find(m => m._id !== user._id)?.isOnline ? 'Available' : 'Offline' 
                : undefined}
              size="md"
            />
            
            <div className="ml-3">
              <h2 className="font-medium text-gray-800 dark:text-gray-200">
                {getConversationName()}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getConversationStatus()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200 dark