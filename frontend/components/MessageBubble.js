// components/MessageBubble.js
import { useState } from "react";
import { format } from "date-fns";
import {
  DotsVerticalIcon,
  ReplyIcon,
  TrashIcon,
  ClipboardCopyIcon,
  CheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/outline";
import Avatar from "./Avatar";
import { useAuth } from "@/hooks/useAuth";

export default function MessageBubble({
  message,
  isOwnMessage,
  isGrouped = false,
  showAvatar = true,
  onReply,
  onDelete,
}) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  // Get message status
  const getMessageStatus = () => {
    if (message.isOptimistic) {
      return "sending";
    } else if (message.readBy && message.readBy.some((id) => id !== user._id)) {
      return "read";
    } else if (
      message.deliveredTo &&
      message.deliveredTo.some((id) => id !== user._id)
    ) {
      return "delivered";
    } else {
      return "sent";
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    const status = getMessageStatus();

    switch (status) {
      case "read":
        return <CheckCircleIcon className="w-4 h-4 text-blue-500" />;
      case "delivered":
        return <CheckIcon className="w-4 h-4 text-gray-400" />;
      case "sent":
        return <CheckIcon className="w-4 h-4 text-gray-400" />;
      case "sending":
        return (
          <svg
            className="w-4 h-4 text-gray-400 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        );
      default:
        return null;
    }
  };

  // Handle menu actions
  const handleMenuAction = (action) => {
    setShowMenu(false);

    switch (action) {
      case "reply":
        onReply && onReply();
        break;
      case "delete":
        onDelete && onDelete();
        break;
      case "copy":
        navigator.clipboard.writeText(message.content);
        break;
      default:
        break;
    }
  };

  // Format the time
  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), "h:mm a")
    : "";

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group`}
    >
      {/* Avatar (only for other people's messages and if not grouped) */}
      {!isOwnMessage && showAvatar ? (
        <div className="flex-shrink-0 mr-2">
          <Avatar
            src={message.senderData?.avatar}
            alt={message.senderData?.username || "User"}
            size="sm"
          />
        </div>
      ) : (
        !isOwnMessage && (
          <div className="w-8 mr-2"></div> // Placeholder for alignment
        )
      )}

      <div
        className={`max-w-[75%] ${
          isGrouped ? (isOwnMessage ? "mr-10" : "ml-10") : ""
        }`}
      >
        {/* Message container */}
        <div className="relative">
          {/* Reply reference */}
          {message.replyTo && (
            <div
              className={`mb-1 p-2 rounded-lg text-xs max-w-[90%] ${
                isOwnMessage
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ml-auto rounded-br-none"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 mr-auto rounded-bl-none"
              }`}
            >
              <div className="font-medium">
                {message.replyToData?.senderData?.username === user?.username
                  ? "You"
                  : message.replyToData?.senderData?.username || "User"}
              </div>
              <div className="truncate">
                {message.replyToData?.content || "[Attachment]"}
              </div>
            </div>
          )}

          {/* Message bubble */}
          <div className="relative group">
            {/* Message content */}
            <div
              className={`p-3 rounded-lg ${
                isOwnMessage
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm"
              }`}
            >
              {/* Text content */}
              {message.contentType === "text" && message.content && (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className={`${message.content ? "mt-2" : ""}`}>
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="mb-1 last:mb-0">
                      {attachment.type === "image" ? (
                        <div className="rounded-md overflow-hidden">
                          <img
                            src={attachment.url}
                            alt={attachment.name || "Image"}
                            className="max-h-60 w-auto"
                          />
                        </div>
                      ) : attachment.type === "video" ? (
                        <video
                          src={attachment.url}
                          controls
                          className="max-h-60 rounded-md w-full"
                        />
                      ) : attachment.type === "audio" ? (
                        <audio
                          src={attachment.url}
                          controls
                          className="w-full"
                        />
                      ) : (
                        <div className="flex items-center space-x-2 p-2 rounded-md bg-white/20 dark:bg-gray-700/20">
                          <div className="text-2xl">📎</div>
                          <div className="overflow-hidden flex-1">
                            <div className="truncate text-sm">
                              {attachment.name}
                            </div>
                            <div className="text-xs opacity-70">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <button className="p-1 hover:bg-white/20 dark:hover:bg-gray-700/40 rounded-full">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message menu */}
            <div
              className={`absolute top-0 ${
                isOwnMessage
                  ? "left-0 -translate-x-full pl-2"
                  : "right-0 translate-x-full pr-2"
              } 
                opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
            >
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <DotsVerticalIcon className="w-5 h-5" />
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                  <div
                    className={`absolute ${
                      isOwnMessage ? "left-0" : "right-0"
                    } bottom-0 translate-y-full mb-1 z-10
                      bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden w-36`}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handleMenuAction("reply")}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 
                          hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <ReplyIcon className="w-4 h-4 mr-2" />
                        Reply
                      </button>
                      <button
                        onClick={() => handleMenuAction("copy")}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 
                          hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <ClipboardCopyIcon className="w-4 h-4 mr-2" />
                        Copy
                      </button>
                      {isOwnMessage && (
                        <button
                          onClick={() => handleMenuAction("delete")}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 
                            hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                        >
                          <TrashIcon className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time and status */}
          <div
            className={`flex items-center text-xs mt-1 space-x-1 text-gray-500 dark:text-gray-400
              ${isOwnMessage ? "justify-end" : "justify-start"}`}
          >
            <span>{formattedTime}</span>
            {isOwnMessage && getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}
