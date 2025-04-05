// App Layout Component (pages/chat.js)
import { useState, useEffect } from "react";
import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import ProfilePanel from "@/components/ProfilePanel";
import MobileNavigation from "@/components/MobileNavigation";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import useConversations from "@/hooks/useConversations";

export default function ChatPage() {
  const [activeConversation, setActiveConversation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [view, setView] = useState("conversations"); // conversations, contacts, settings
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { connected, socket } = useSocket();
  const { user } = useAuth();
  const { conversations, loading, error } = useConversations();

  // Close sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && activeConversation) {
      setSidebarOpen(false);
    }
  }, [activeConversation, isMobile]);

  // Reset layout when screen size changes
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <>
      <Head>
        <title>Chat App</title>
        <meta name="description" content="Real-time chat application" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transform transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-30
          md:relative md:translate-x-0 w-80 bg-white dark:bg-gray-800 border-r 
          border-gray-200 dark:border-gray-700 flex flex-col`}
        >
          <Sidebar
            view={view}
            setView={setView}
            conversations={conversations}
            loading={loading}
            error={error}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {activeConversation ? (
            <ChatArea
              conversation={activeConversation}
              onBackClick={() => {
                if (isMobile) {
                  setSidebarOpen(true);
                }
              }}
              onProfileClick={() => setProfileOpen(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  />
                </svg>
                <h3 className="text-xl font-medium mb-2">
                  No conversation selected
                </h3>
                <p className="text-sm">
                  {conversations.length > 0
                    ? "Select a conversation to start chatting"
                    : "Start a new conversation by clicking the new message button"}
                </p>
                {isMobile && !sidebarOpen && (
                  <button
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={() => setSidebarOpen(true)}
                  >
                    Show Conversations
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile/info panel - slides in from right */}
        <div
          className={`${
            profileOpen ? "translate-x-0" : "translate-x-full"
          } transform transition-transform duration-300 ease-in-out fixed inset-y-0 right-0 z-40
          w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700`}
        >
          {activeConversation && (
            <ProfilePanel
              conversation={activeConversation}
              onClose={() => setProfileOpen(false)}
            />
          )}
        </div>

        {/* Mobile navigation bar */}
        {isMobile && (
          <MobileNavigation
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
          />
        )}

        {/* Overlay for mobile */}
        {isMobile && (sidebarOpen || profileOpen) && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => {
              setSidebarOpen(false);
              setProfileOpen(false);
            }}
          />
        )}
      </div>
    </>
  );
}
