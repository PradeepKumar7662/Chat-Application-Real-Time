
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import {
  MoreVertical,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

function ChatsList() {
  const {
    getMyChatPartners,
    chats,
    isUsersLoading,
    setSelectedUser,
    deleteUser,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();

  const [activeMenu, setActiveMenu] = useState(null);

useEffect(() => {
  if (!activeMenu) return;

  // Automatically close after 3 seconds
  const timer = setTimeout(() => {
    setActiveMenu(null);
  }, 3000);

  // Close when clicking anywhere outside the menu
  const handleOutsideClick = () => {
    setActiveMenu(null);
  };

  document.addEventListener("click", handleOutsideClick);

  return () => {
    clearTimeout(timer);
    document.removeEventListener("click", handleOutsideClick);
  };
}, [activeMenu]);
const [deleteModal, setDeleteModal] = useState({
  isOpen: false,
  userId: null,
  fullName: "",
});

const [isDeleting, setIsDeleting] = useState(false);

useEffect(() => {
  getMyChatPartners();
}, [getMyChatPartners]);

// Auto close Delete Chat modal after 3 seconds
useEffect(() => {
  if (!deleteModal.isOpen) return;

  const timer = setTimeout(() => {
    setDeleteModal({
      isOpen: false,
      userId: null,
      fullName: "",
    });
  }, 3000);

  return () => clearTimeout(timer);
}, [deleteModal.isOpen]);

  
  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;

  const openMenu = (e, userId) => {
    e.stopPropagation();

    setActiveMenu(
      activeMenu === userId ? null : userId
    );
  };

  const openDeleteModal = (e, userId, fullName) => {
    e.stopPropagation();

    setActiveMenu(null);

    setDeleteModal({
      isOpen: true,
      userId,
      fullName,
    });
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;

    setDeleteModal({
      isOpen: false,
      userId: null,
      fullName: "",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.userId) return;

    try {
      setIsDeleting(true);

      await deleteUser(deleteModal.userId);

      setDeleteModal({
        isOpen: false,
        userId: null,
        fullName: "",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* CHAT LIST */}
      <div className="space-y-3">
        {chats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => setSelectedUser(chat)}
            className="
              group
              relative
              bg-green-800/40
              border border-green-700/30
              p-3
              rounded-xl
              cursor-pointer
              transition-all
              duration-300
              hover:bg-green-700/40
              hover:border-cyan-400/30
              hover:shadow-lg
              hover:shadow-cyan-500/5
            "
          >
            <div className="flex items-center gap-3">

              {/* PROFILE */}
              <div
                className={`avatar ${
                  onlineUsers.includes(chat._id)
                    ? "online"
                    : "offline"
                }`}
              >
                <div
                  className="
                    size-12
                    rounded-full
                    ring-2
                    ring-green-700/50
                    group-hover:ring-cyan-400/40
                    transition-all
                  "
                >
                  <img
                    src={chat.profilePic || "/avatar.png"}
                    alt={chat.fullName}
                    className="object-cover"
                  />
                </div>
              </div>

              {/* USER INFO */}
              <div className="flex-1 min-w-0">
                <h4
                  className="
                    text-slate-200
                    font-semibold
                    truncate
                    group-hover:text-cyan-300
                    transition-colors
                  "
                >
                  {chat.fullName}
                </h4>

                <p className="text-xs text-slate-500 mt-0.5">
                  {onlineUsers.includes(chat._id)
                    ? "Active now"
                    : "Offline"}
                </p>
              </div>

              {/* THREE DOT MENU */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) =>
                    openMenu(e, chat._id)
                  }
                  className="
                    size-9
                    flex
                    items-center
                    justify-center
                    rounded-lg
                    text-slate-500
                    opacity-0
                    group-hover:opacity-100
                    hover:text-white
                    hover:bg-slate-800/80
                    transition-all
                  "
                >
                  <MoreVertical size={19} />
                </button>

                {/* MENU */}
                {activeMenu === chat._id && (
                  <div
                    className="
                      absolute
                      right-0
                      top-10
                      z-50
                      w-40
                      p-1.5
                      rounded-xl
                      bg-slate-900
                      border border-slate-700
                      shadow-xl
                      shadow-black/40
                    "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) =>
                        openDeleteModal(
                          e,
                          chat._id,
                          chat.fullName
                        )
                      }
                      className="
                        w-full
                        flex
                        items-center
                        gap-2
                        px-3
                        py-2.5
                        rounded-lg
                        text-sm
                        text-red-400
                        hover:bg-red-500/10
                        hover:text-red-300
                        transition-colors
                      "
                    >
                      <Trash2 size={16} />
                      Delete User
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* DELETE MODAL */}
      {deleteModal.isOpen && (
        <div
          className="
            fixed
            inset-0
            z-[999]
            flex
            items-center
            justify-center
            p-4
            bg-black/70
            backdrop-blur-sm
          "
          onClick={closeDeleteModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              w-full
              max-w-md
              bg-slate-900/95
              border border-slate-700/70
              rounded-2xl
              shadow-2xl
              overflow-hidden
            "
          >
            <div className="relative p-6">

              {/* CLOSE */}
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="
                  absolute
                  top-4
                  right-4
                  size-8
                  flex
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  hover:text-white
                  hover:bg-slate-800
                "
              >
                <X size={18} />
              </button>

              {/* ICON */}
              <div
                className="
                  size-14
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-red-500/10
                  border border-red-500/20
                  mb-5
                "
              >
                <AlertTriangle
                  size={28}
                  className="text-red-400"
                />
              </div>

              <h2 className="text-xl font-bold text-white">
                Delete Chat?
              </h2>

              <p className="text-sm text-slate-400 mt-2 leading-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-200">
                  {deleteModal.fullName}
                </span>
                ?
              </p>

              <p className="text-xs text-slate-500 mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="border-t border-slate-800" />

            <div className="flex gap-3 p-5">

              {/* CANCEL */}
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="
                  flex-1
                  px-4
                  py-2.5
                  rounded-xl
                  bg-slate-800
                  border border-slate-700
                  text-slate-300
                  font-medium
                  hover:bg-slate-700
                  hover:text-white
                  transition-all
                "
              >
                Cancel
              </button>

              {/* DELETE */}
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="
                  flex-1
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-red-500
                  text-white
                  font-semibold
                  hover:bg-red-600
                  hover:shadow-lg
                  hover:shadow-red-500/20
                  transition-all
                  disabled:opacity-60
                "
              >
                {isDeleting ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Delete Chat
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatsList;

