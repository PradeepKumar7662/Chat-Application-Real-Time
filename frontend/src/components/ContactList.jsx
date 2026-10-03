
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import {
  Trash2,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

function ContactList() {
  const {
    getAllContacts,
    allContacts,
    setSelectedUser,
    isUsersLoading,
    deleteUser,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    fullName: "",
  });

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
  if (!deleteModal.isOpen || isDeleting) return;

  const timer = setTimeout(() => {
    setDeleteModal({
      isOpen: false,
      userId: null,
      fullName: "",
    });
  }, 3000);

  return () => clearTimeout(timer);
}, [deleteModal.isOpen, isDeleting]);

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  // Open delete modal
  const openDeleteModal = (e, userId, fullName) => {
    e.stopPropagation();

    setDeleteModal({
      isOpen: true,
      userId,
      fullName,
    });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (isDeleting) return;

    setDeleteModal({
      isOpen: false,
      userId: null,
      fullName: "",
    });
  };

  // Confirm delete
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
      {/* CONTACT LIST */}
      <div className="space-y-3">
        {allContacts.map((contact) => (
          <div
            key={contact._id}
            onClick={() => setSelectedUser(contact)}
            className="
              group
              relative
              bg-slate-800/60
              border border-slate-700/50
              p-3
              rounded-xl
              cursor-pointer
              transition-all
              duration-300
              hover:bg-slate-700/70
              hover:border-cyan-400/30
              hover:shadow-lg
              hover:shadow-cyan-500/5
              hover:-translate-y-[1px]
            "
          >
            <div className="flex items-center gap-3">

              {/* PROFILE IMAGE */}
              <div
                className={`avatar ${
                  onlineUsers.includes(contact._id)
                    ? "online"
                    : "offline"
                }`}
              >
                <div
                  className="
                    size-12
                    rounded-full
                    ring-2
                    ring-slate-700
                    group-hover:ring-cyan-400/30
                    transition-all
                    duration-300
                  "
                >
                  <img
                    src={contact.profilePic || "/avatar.png"}
                    alt={contact.fullName}
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
                    duration-300
                  "
                >
                  {contact.fullName}
                </h4>

                <p className="text-xs text-slate-500 mt-0.5">
                  {onlineUsers.includes(contact._id)
                    ? "Active now"
                    : "Offline"}
                </p>
              </div>

              {/* DELETE BUTTON */}
              <button
                type="button"
                onClick={(e) =>
                  openDeleteModal(
                    e,
                    contact._id,
                    contact.fullName
                  )
                }
                title={`Delete ${contact.fullName}`}
                className="
                  flex
                  items-center
                  justify-center
                  size-9
                  rounded-lg
                  text-slate-500
                  bg-slate-900/40
                  border border-transparent
                  opacity-0
                  group-hover:opacity-100
                  hover:text-red-400
                  hover:bg-red-500/10
                  hover:border-red-500/20
                  hover:scale-110
                  active:scale-95
                  transition-all
                  duration-200
                "
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
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
          {/* MODAL */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="
              w-full
              max-w-md
              bg-slate-900/95
              border
              border-slate-700/70
              rounded-2xl
              shadow-2xl
              shadow-black/50
              overflow-hidden
              animate-[fadeIn_0.2s_ease-out]
            "
          >
            {/* TOP SECTION */}
            <div className="relative p-6 pb-5">

              {/* CLOSE BUTTON */}
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
                  hover:text-slate-200
                  hover:bg-slate-800
                  transition-colors
                  disabled:opacity-40
                "
              >
                <X size={18} />
              </button>

              {/* DELETE ICON */}
              <div
                className="
                  size-14
                  rounded-2xl
                  flex
                  items-center
                  justify-center
                  bg-red-500/10
                  border
                  border-red-500/20
                  mb-5
                "
              >
                <AlertTriangle
                  size={28}
                  className="text-red-400"
                />
              </div>

              {/* TITLE */}
              <h2 className="text-xl font-bold text-white">
                Delete User?
              </h2>

              {/* DESCRIPTION */}
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

            {/* DIVIDER */}
            <div className="border-t border-slate-800" />

            {/* BUTTONS */}
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
                  border
                  border-slate-700
                  text-slate-300
                  font-medium
                  hover:bg-slate-700
                  hover:text-white
                  transition-all
                  disabled:opacity-50
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
                  active:scale-[0.98]
                  transition-all
                  disabled:opacity-60
                  disabled:cursor-not-allowed
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
                    Delete User
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

export default ContactList;

