// components/Sidebar.js
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  SearchIcon,
  XIcon,
  PlusIcon,
  MenuIcon,
  UserIcon,
  ChatIcon,
  UserGroupIcon,
  CogIcon,
} from "@heroicons/react/outline";
import { format } from "date-fns";
import Avatar from "./Avatar";
import ConversationsList from "./ConversationsList";
import ContactsList from "./ContactsList";
import SettingsPanel from "./SettingsPanel";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar({
  view,
  setView,
  conversations,
  loading,
  error,
  activeConversation,
  setActiveConversation,
  onClose,
}) {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Handle view changes (conversations, contacts, settings)
  const handleViewChange = (newView) => {
    setView(newView);
    setSearchTerm("");
  };

  return (
    <>
      {/* Sidebar header */}
      <div className="h-16 min-h-[4rem] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Avatar
            src={user?.avatar}
            alt={user?.username}
            status={user?.status || "Available"}
            size="md"
          />
          <div className="font-medium truncate">
            <div>{user?.username}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user?.status || "Available"}
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <ThemeToggle className="mr-2" />
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <XIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${
              view === "contacts" ? "contacts" : "conversations"
            }...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 
            rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleViewChange("conversations")}
          className={`flex-1 py-3 text-sm font-medium ${
            view === "conversations"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <ChatIcon className="w-5 h-5 mx-auto mb-1" />
          <span>Chats</span>
        </button>
        <button
          onClick={() => handleViewChange("contacts")}
          className={`flex-1 py-3 text-sm font-medium ${
            view === "contacts"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <UserIcon className="w-5 h-5 mx-auto mb-1" />
          <span>Contacts</span>
        </button>
        <button
          onClick={() => handleViewChange("settings")}
          className={`flex-1 py-3 text-sm font-medium ${
            view === "settings"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <CogIcon className="w-5 h-5 mx-auto mb-1" />
          <span>Settings</span>
        </button>
      </div>

      {/* Main content area with scrolling */}
      <div className="flex-1 overflow-y-auto">
        {/* Conditional view rendering */}
        {view === "conversations" && (
          <>
            {/* New conversation button */}
            <div className="p-4">
              <button
                className="flex items-center justify-center w-full py-2 px-4 rounded-lg 
                bg-blue-500 hover:bg-blue-600 text-white font-medium transition duration-150"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Conversation
              </button>
            </div>

            {/* Conversations list */}
            <ConversationsList
              conversations={conversations}
              searchTerm={searchTerm}
              loading={loading}
              error={error}
              activeConversationId={activeConversation?._id}
              onConversationClick={setActiveConversation}
            />
          </>
        )}

        {view === "contacts" && (
          <ContactsList
            searchTerm={searchTerm}
            onContactClick={(contact) => {
              // Logic to start new conversation with contact
            }}
          />
        )}

        {view === "settings" && <SettingsPanel user={user} onLogout={logout} />}
      </div>
    </>
  );
}

// ConversationsList.js preview (this would be implemented in full)
function ConversationsList({
  conversations,
  searchTerm,
  loading,
  error,
  activeConversationId,
  onConversationClick,
}) {
  // Filter conversations based on search term
  const filteredConversations = searchTerm
    ? conversations.filter((convo) => {
        // For private chats, search the other user's name
        if (convo.type === "private") {
          const otherUser = convo.members.find(
            (member) => member._id !== user._id
          );
          return otherUser?.username
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        }
        // For groups, search the group name
        return convo.name.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : conversations;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load conversations. Please try again.
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        {searchTerm ? "No conversations found." : "No conversations yet."}
      </div>
    );
  }

  return (
    <div>
      {filteredConversations.map((conversation) => (
        <ConversationItem
          key={conversation._id}
          conversation={conversation}
          isActive={conversation._id === activeConversationId}
          onClick={() => onConversationClick(conversation)}
        />
      ))}
    </div>
  );
}

// ConversationItem preview (would be implemented in full)
function ConversationItem({ conversation, isActive, onClick }) {
  // Dummy implementation for preview
  const isUnread = conversation.unreadCount > 0;
  const lastMessage = conversation.lastMessage;

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 flex items-center border-b border-gray-200 dark:border-gray-700 cursor-pointer
      ${
        isActive
          ? "bg-blue-50 dark:bg-blue-900/20"
          : "hover:bg-gray-100 dark:hover:bg-gray-700/30"
      } 
      ${isUnread ? "font-semibold" : ""}`}
    >
      <Avatar
        src={conversation.avatar}
        alt={conversation.name}
        status={
          conversation.type === "private"
            ? conversation.otherUser?.isOnline
              ? "Available"
              : "Offline"
            : undefined
        }
        size="lg"
      />

      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex justify-between items-baseline">
          <h3 className="text-sm font-medium truncate">
            {conversation.name || conversation.otherUser?.username}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {lastMessage
              ? format(new Date(lastMessage.createdAt), "h:mm a")
              : ""}
          </span>
        </div>

        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mr-2">
            {lastMessage ? (
              lastMessage.sender === user._id ? (
                <span className="text-gray-400 dark:text-gray-500">You: </span>
              ) : (
                <span></span>
              )
            ) : (
              ""
            )}
            {lastMessage?.content || "No messages yet"}
          </p>

          {isUnread && (
            <span className="flex-shrink-0 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
