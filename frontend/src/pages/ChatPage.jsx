
import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();

  return (
    <div
      className="
        relative
        w-full
        max-w-6xl
        h-[100dvh]
        md:h-[800px]
        mx-auto
        md:p-0
      "
    >
      <BorderAnimatedContainer>

        {/* ================= LEFT SIDEBAR ================= */}
        <div
          className={`
            h-full
            flex-col
            bg-slate-900/90
            backdrop-blur-xl
            border-r
            border-cyan-500/20

            w-full
            md:w-80
            md:flex

            ${
              selectedUser
                ? "hidden md:flex"
                : "flex"
            }
          `}
        >
          {/* ================= PROFILE HEADER ================= */}
          <div className="shrink-0">
            <ProfileHeader />
          </div>

          {/* ================= CHAT / CONTACT TABS ================= */}
          <div className="shrink-0">
            <ActiveTabSwitch />
          </div>

          {/* ================= CHAT / CONTACT LIST ================= */}
          <div
            className="
              flex-1
              min-h-0
              overflow-y-auto

              px-3
              py-3
              sm:p-4

              space-y-2

              scrollbar-thin
              scrollbar-thumb-slate-600
              scrollbar-track-transparent
            "
          >
            {activeTab === "chats" ? (
              <ChatsList />
            ) : (
              <ContactList />
            )}
          </div>
        </div>

        {/* ================= RIGHT CHAT AREA ================= */}
        <div
          className={`
            h-full
            min-w-0
            flex-col
            bg-slate-950/60
            backdrop-blur-xl

            w-full
            md:flex-1

            ${
              selectedUser
                ? "flex"
                : "hidden md:flex"
            }
          `}
        >
          {selectedUser ? (
            <ChatContainer />
          ) : (
            <NoConversationPlaceholder />
          )}
        </div>

      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;

