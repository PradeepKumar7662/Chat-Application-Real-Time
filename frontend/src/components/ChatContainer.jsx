import { useEffect, useRef, useState } from "react";

import {
  FileTextIcon,
  DownloadIcon,
  Trash2Icon,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";

import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const longPressTimer = useRef(null);

  // Message scroll container
  const messageContainerRef = useRef(null);

  // Store every message DOM element
  const messageElementRefs = useRef(new Map());

  // Menu placement
  const [reactionPlacement, setReactionPlacement] =
    useState("bottom");

  const [deleteMenuPlacement, setDeleteMenuPlacement] =
    useState("bottom");

  // --------------------------------------------------
  // REACTION MENU
  // --------------------------------------------------

  const [activeReactionMessage, setActiveReactionMessage] =
    useState(null);

  // --------------------------------------------------
  // DESKTOP MESSAGE OPTIONS
  // --------------------------------------------------

  const [activeDeleteMessage, setActiveDeleteMessage] =
    useState(null);

  // --------------------------------------------------
  // MOBILE ACTION SHEET
  // --------------------------------------------------

  const [showMobileActions, setShowMobileActions] =
    useState(false);

  const [mobileActionMessage, setMobileActionMessage] =
    useState(null);

  // --------------------------------------------------
  // SELECTED MESSAGES
  // --------------------------------------------------

  const [selectedMessages, setSelectedMessages] =
    useState([]);

  const [isSelectionMode, setIsSelectionMode] =
    useState(false);

  // --------------------------------------------------
  // DELETE CONFIRMATION
  // --------------------------------------------------

  const [deleteMenuOpen, setDeleteMenuOpen] =
    useState(false);

  // --------------------------------------------------
  // DELETE ANIMATION
  // --------------------------------------------------

  const [deletingMessageIds, setDeletingMessageIds] =
    useState([]);

  // --------------------------------------------------
  // CHECK OWN MESSAGE
  // --------------------------------------------------

  const isOwnMessage = (msg) => {
    return (
      msg.senderId === authUser?._id ||
      msg.senderId?.toString() ===
        authUser?._id?.toString()
    );
  };

  // --------------------------------------------------
// MESSAGE STATUS
// --------------------------------------------------
const getMessageStatus = (message) => {
  if (!isOwnMessage(message)) return null;

  // Backend se read status aane par blue tick
  if (message.isRead === true || message.readAt) {
    return "read";
  }

  // Backend se delivered status aane par double tick
  if (message.isDelivered === true || message.deliveredAt) {
    return "delivered";
  }

  // Default: sent
  return "sent";
};

  // --------------------------------------------------
  // CHECK IF MESSAGE IS AT TOP
  // --------------------------------------------------

  const isMessageAtTop = (messageId) => {
    const messageElement =
      messageElementRefs.current.get(messageId);

    const container =
      messageContainerRef.current;

    if (!messageElement || !container) {
      return false;
    }

    const messageRect =
      messageElement.getBoundingClientRect();

    const containerRect =
      container.getBoundingClientRect();

    const distanceFromTop =
      messageRect.top - containerRect.top;

    /*
      80px threshold rakha hai.

      Iska matlab:
      message agar chat ke upper/top area
      ke 80px ke andar hai to side menu show hoga.
    */

    return distanceFromTop <= 80;
  };

  // --------------------------------------------------
  // GET MESSAGE MENU PLACEMENT
  // --------------------------------------------------

  const getMessageMenuPlacement = (
    messageId,
    own
  ) => {
    const atTop = isMessageAtTop(messageId);

    // TOP MESSAGE
    if (atTop) {
      // Sender -> LEFT
      // Receiver -> RIGHT
      return own ? "left" : "right";
    }

    // Normal messages -> existing bottom position
    return "bottom";
  };

  // --------------------------------------------------
  // SELECT MESSAGE
  // --------------------------------------------------

  const toggleMessageSelection = (messageId) => {
    setSelectedMessages((current) => {
      const alreadySelected =
        current.includes(messageId);

      const updated = alreadySelected
        ? current.filter((id) => id !== messageId)
        : [...current, messageId];

      setIsSelectionMode(updated.length > 0);

      return updated;
    });
  };

  // --------------------------------------------------
  // GET SELECTED MESSAGE OBJECTS
  // --------------------------------------------------

  const selectedMessageObjects = messages.filter(
    (message) =>
      selectedMessages.includes(message._id)
  );

  // --------------------------------------------------
  // CAN DELETE FOR EVERYONE
  // --------------------------------------------------

  const canDeleteForEveryone =
    selectedMessageObjects.length > 0 &&
    selectedMessageObjects.every((message) =>
      isOwnMessage(message)
    );

  // --------------------------------------------------
  // CLEAR SELECTION
  // --------------------------------------------------

  const cancelSelection = () => {
    setSelectedMessages([]);
    setIsSelectionMode(false);
    setDeleteMenuOpen(false);
    setActiveDeleteMessage(null);
    setActiveReactionMessage(null);
    setShowMobileActions(false);
    setMobileActionMessage(null);
  };

  // --------------------------------------------------
  // CLOSE MENUS
  // --------------------------------------------------

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveReactionMessage(null);
      setActiveDeleteMessage(null);
    };

    document.addEventListener(
      "click",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleOutsideClick
      );
    };
  }, []);

  // --------------------------------------------------
  // GET MESSAGES
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedUser?._id) return;

    hasInitialScrolled.current = false;
    previousMessageCount.current = 0;

    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser,
    getMessagesByUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  // --------------------------------------------------
  // DELETE SOCKET EVENTS
  // --------------------------------------------------

  useEffect(() => {
    const socket =
      useAuthStore.getState().socket;

    if (!socket) return;

    // Delete for me - single
    const handleMessageDeletedForMe = (
      deletedMessageId
    ) => {
      setDeletingMessageIds([
        deletedMessageId,
      ]);

      setTimeout(() => {
        useChatStore.setState((state) => ({
          messages: state.messages.filter(
            (message) =>
              message._id !== deletedMessageId
          ),
        }));

        setDeletingMessageIds([]);

        setSelectedMessages((current) =>
          current.filter(
            (id) => id !== deletedMessageId
          )
        );
      }, 300);
    };

    // Delete for me - multiple
    const handleMessagesDeletedForMe = (
      deletedMessageIds
    ) => {
      setDeletingMessageIds(
        deletedMessageIds
      );

      setTimeout(() => {
        useChatStore.setState((state) => ({
          messages: state.messages.filter(
            (message) =>
              !deletedMessageIds.includes(
                message._id
              )
          ),
        }));

        setDeletingMessageIds([]);
        setSelectedMessages([]);
        setIsSelectionMode(false);
        setDeleteMenuOpen(false);
      }, 300);
    };

    // Delete for everyone
    const handleMessagesDeletedForEveryone = (
      deletedMessageIds
    ) => {
      const ids = Array.isArray(
        deletedMessageIds
      )
        ? deletedMessageIds
        : [deletedMessageIds];

      setDeletingMessageIds(ids);

      setTimeout(() => {
        useChatStore.setState((state) => ({
          messages: state.messages.filter(
            (message) =>
              !ids.includes(message._id)
          ),
        }));

        setDeletingMessageIds([]);
        setSelectedMessages([]);
        setIsSelectionMode(false);
        setDeleteMenuOpen(false);
        setActiveDeleteMessage(null);
        setActiveReactionMessage(null);
      }, 300);
    };

    socket.on(
      "messageDeletedForMe",
      handleMessageDeletedForMe
    );

    socket.on(
      "messagesDeletedForMe",
      handleMessagesDeletedForMe
    );

    socket.on(
      "messagesDeletedForEveryone",
      handleMessagesDeletedForEveryone
    );

    return () => {
      socket.off(
        "messageDeletedForMe",
        handleMessageDeletedForMe
      );

      socket.off(
        "messagesDeletedForMe",
        handleMessagesDeletedForMe
      );

      socket.off(
        "messagesDeletedForEveryone",
        handleMessagesDeletedForEveryone
      );
    };
  }, []);

  // --------------------------------------------------
  // AUTO SCROLL
  // --------------------------------------------------

  const previousMessageCount =
    useRef(0);

  const hasInitialScrolled =
    useRef(false);

  useEffect(() => {
    // First time messages load
    if (!hasInitialScrolled.current) {
      if (messages.length > 0) {
        requestAnimationFrame(() => {
          messageEndRef.current?.scrollIntoView({
            behavior: "auto",
          });
        });

        hasInitialScrolled.current = true;
      }

      previousMessageCount.current =
        messages.length;

      return;
    }

    // Only NEW message -> scroll bottom
    if (
      messages.length >
      previousMessageCount.current
    ) {
      requestAnimationFrame(() => {
        messageEndRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      });
    }

    previousMessageCount.current =
      messages.length;
  }, [messages]);

  useEffect(() => {
  if (!selectedUser?._id || !messages.length) return;

  const socket = useAuthStore.getState().socket;

  if (!socket) return;

  const unreadMessageIds = messages
    .filter(
      (message) =>
        message.receiverId?.toString() ===
          authUser?._id?.toString() &&
        !message.isRead
    )
    .map((message) => message._id);

  if (unreadMessageIds.length === 0) return;

  socket.emit("messagesRead", {
    messageIds: unreadMessageIds,
  });
}, [
  messages,
  selectedUser,
  authUser,
]);

  // --------------------------------------------------
  // REACTIONS
  // --------------------------------------------------

  const reactions = [
    "❤️",
    "👍",
    "😂",
    "😮",
    "😢",
    "🔥",
  ];

  const handleReaction = async (
    messageId,
    emoji
  ) => {
    try {
      const res = await axiosInstance.post(
        `/messages/react/${messageId}`,
        {
          emoji,
        }
      );

      useChatStore.setState((state) => ({
        messages: state.messages.map(
          (message) =>
            message._id === messageId
              ? res.data
              : message
        ),
      }));

      setActiveReactionMessage(null);
    } catch (error) {
      console.log(
        "Reaction error:",
        error.response?.data?.message ||
          error.message
      );
    }
  };

  // --------------------------------------------------
  // DELETE FOR ME
  // --------------------------------------------------

  const handleDeleteForMe = async () => {
    if (selectedMessages.length === 0)
      return;

    const idsToDelete = [
      ...selectedMessages,
    ];

    try {
      setDeletingMessageIds(
        idsToDelete
      );

      setDeleteMenuOpen(false);

      await axiosInstance.delete(
        "/messages/delete-for-me",
        {
          data: {
            messageIds: idsToDelete,
          },
        }
      );

      setTimeout(() => {
        useChatStore.setState((state) => ({
          messages: state.messages.filter(
            (message) =>
              !idsToDelete.includes(
                message._id
              )
          ),
        }));

        setDeletingMessageIds([]);
        setSelectedMessages([]);
        setIsSelectionMode(false);
        setActiveDeleteMessage(null);
        setShowMobileActions(false);
        setMobileActionMessage(null);
      }, 300);
    } catch (error) {
      console.log(
        "Delete for me error:",
        error.response?.data?.message ||
          error.message
      );

      setDeletingMessageIds([]);
    }
  };

  // --------------------------------------------------
  // DELETE FOR EVERYONE
  // --------------------------------------------------

  const handleDeleteForEveryone =
    async () => {
      if (selectedMessages.length === 0)
        return;

      const idsToDelete = [
        ...selectedMessages,
      ];

      // Safety check
      const selectedObjects =
        messages.filter((message) =>
          idsToDelete.includes(
            message._id
          )
        );

      const allOwnMessages =
        selectedObjects.length > 0 &&
        selectedObjects.every((message) =>
          isOwnMessage(message)
        );

      if (!allOwnMessages) {
        return;
      }

      try {
        setDeletingMessageIds(
          idsToDelete
        );

        setDeleteMenuOpen(false);

        await axiosInstance.delete(
          "/messages/delete-for-everyone",
          {
            data: {
              messageIds: idsToDelete,
            },
          }
        );

        setTimeout(() => {
          useChatStore.setState((state) => ({
            messages: state.messages.filter(
              (message) =>
                !idsToDelete.includes(
                  message._id
                )
            ),
          }));

          setDeletingMessageIds([]);
          setSelectedMessages([]);
          setIsSelectionMode(false);
          setActiveDeleteMessage(null);
          setShowMobileActions(false);
          setMobileActionMessage(null);
        }, 300);
      } catch (error) {
        console.log(
          "Delete for everyone error:",
          error.response?.data?.message ||
            error.message
        );

        setDeletingMessageIds([]);
      }
    };

  // --------------------------------------------------
  // DESKTOP RIGHT CLICK
  // --------------------------------------------------

  const handleContextMenu = (
    event,
    message
  ) => {
    event.preventDefault();

    if (isSelectionMode) return;

    const own = isOwnMessage(message);

    const placement =
      getMessageMenuPlacement(
        message._id,
        own
      );

    setActiveReactionMessage(null);

    setDeleteMenuPlacement(
      placement
    );

    setActiveDeleteMessage(
      message._id
    );
  };

  // --------------------------------------------------
  // MOBILE LONG PRESS START
  // --------------------------------------------------

  const handleTouchStart = (
    message
  ) => {
    if (isSelectionMode) return;

    if (longPressTimer.current) {
      clearTimeout(
        longPressTimer.current
      );
    }

    longPressTimer.current =
      setTimeout(() => {
        setActiveReactionMessage(null);
        setActiveDeleteMessage(null);

        setMobileActionMessage(
          message
        );

        setShowMobileActions(true);

        longPressTimer.current = null;
      }, 600);
  };

  // --------------------------------------------------
  // MOBILE LONG PRESS END
  // --------------------------------------------------

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(
        longPressTimer.current
      );

      longPressTimer.current = null;
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (isMessagesLoading) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader />
        <MessagesLoadingSkeleton />
        <MessageInput />
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  return (
    <div
      className="
        relative
        flex flex-col
        h-full
        min-h-0
        bg-slate-950
      "
    >
      {/* CHAT HEADER */}

      <ChatHeader />

      {/* MESSAGES AREA */}

      <div
        ref={messageContainerRef}
        className="
          flex-1
          min-h-0
          overflow-y-auto
          px-3 sm:px-5
          py-4
          space-y-3
          scrollbar-thin
          scrollbar-thumb-slate-700
          scrollbar-track-transparent
        "
        onClick={() => {
          setActiveReactionMessage(null);
          setActiveDeleteMessage(null);
        }}
      >
        {messages.length === 0 ? (
          <NoChatHistoryPlaceholder />
        ) : (
          messages.map((message) => {
            const own =
              isOwnMessage(message);

            const isSelected =
              selectedMessages.includes(
                message._id
              );

            const isDeleting =
              deletingMessageIds.includes(
                message._id
              );

            return (
              <div
                key={message._id}
                ref={(element) => {
                  if (element) {
                    messageElementRefs.current.set(
                      message._id,
                      element
                    );
                  } else {
                    messageElementRefs.current.delete(
                      message._id
                    );
                  }
                }}
                className={`
                  relative
                  flex
                  overflow-visible
                  ${
                    own
                      ? "justify-end"
                      : "justify-start"
                  }
                  transition-all
                  duration-300
                  ease-out
                  ${
                    isSelected
                      ? "ring-2 ring-cyan-400/70 rounded-2xl scale-[0.98]"
                      : ""
                  }
                  ${
                    isDeleting
                      ? "opacity-0 scale-75 translate-x-8 blur-sm"
                      : "opacity-100 scale-100 translate-x-0 blur-0"
                  }
                `}
                onContextMenu={(event) =>
                  handleContextMenu(
                    event,
                    message
                  )
                }
                onTouchStart={() =>
                  handleTouchStart(
                    message
                  )
                }
                onTouchEnd={
                  handleTouchEnd
                }
                onTouchCancel={
                  handleTouchEnd
                }
                onTouchMove={
                  handleTouchEnd
                }
              >
                <div
                  className="
                    relative
                    max-w-[85%]
                    sm:max-w-[70%]
                    lg:max-w-[60%]
                  "
                >
                  {/* -------------------------------- */}
                  {/* DESKTOP MESSAGE OPTIONS */}
                  {/* -------------------------------- */}

                  {activeDeleteMessage ===
                    message._id && (
                    <div
                      className={`
                        absolute
                        z-[100]
                        w-[220px]
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-700/70
                        bg-slate-900/95
                        backdrop-blur-xl
                        shadow-[0_15px_50px_rgba(0,0,0,0.6)]
                        animate-in
                        fade-in
                        zoom-in-95
                        duration-200

                        ${
                          deleteMenuPlacement ===
                          "left"
                            ? "right-full mr-2 top-1/2 -translate-y-1/2"
                            : deleteMenuPlacement ===
                              "right"
                            ? "left-full ml-2 top-1/2 -translate-y-1/2"
                            : `bottom-full mb-2 ${
                                own
                                  ? "right-0"
                                  : "left-0"
                              }`
                        }
                      `}
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      <div
                        className="
                          px-4 py-3
                          border-b
                          border-slate-700/50
                        "
                      >
                        <p className="text-sm font-semibold text-white">
                          Message options
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          Select an action
                        </p>
                      </div>

                      {/* REACT */}

                      <button
                        type="button"
                        onClick={() => {
                          const placement =
                            getMessageMenuPlacement(
                              message._id,
                              own
                            );

                          setActiveDeleteMessage(
                            null
                          );

                          setReactionPlacement(
                            placement
                          );

                          setActiveReactionMessage(
                            message._id
                          );
                        }}
                        className="
                          w-full
                          flex items-center gap-3
                          px-4 py-3
                          text-sm
                          text-slate-200
                          hover:bg-slate-800
                          transition-colors
                        "
                      >
                        <span
                          className="
                            flex items-center justify-center
                            w-8 h-8
                            rounded-lg
                            bg-yellow-500/10
                            border
                            border-yellow-500/20
                          "
                        >
                          ❤️
                        </span>

                        <span>
                          React
                        </span>
                      </button>

                      {/* SELECT */}

                      <button
                        type="button"
                        onClick={() => {
                          toggleMessageSelection(
                            message._id
                          );

                          setActiveDeleteMessage(
                            null
                          );
                        }}
                        className="
                          w-full
                          flex items-center gap-3
                          px-4 py-3
                          text-sm
                          text-slate-200
                          hover:bg-slate-800
                          transition-colors
                        "
                      >
                        <span
                          className="
                            flex items-center justify-center
                            w-8 h-8
                            rounded-lg
                            bg-cyan-500/10
                            border
                            border-cyan-500/20
                            text-cyan-400
                          "
                        >
                          ✓
                        </span>

                        <span>
                          Select
                        </span>
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveDeleteMessage(
                            null
                          );

                          setSelectedMessages([
                            message._id,
                          ]);

                          setIsSelectionMode(
                            true
                          );

                          setDeleteMenuOpen(
                            true
                          );
                        }}
                        className="
                          w-full
                          flex items-center gap-3
                          px-4 py-3
                          text-sm
                          text-red-400
                          hover:bg-red-500/10
                          transition-colors
                        "
                      >
                        <span
                          className="
                            flex items-center justify-center
                            w-8 h-8
                            rounded-lg
                            bg-red-500/10
                            border
                            border-red-500/20
                          "
                        >
                          🗑️
                        </span>

                        <span>
                          Delete
                        </span>
                      </button>
                    </div>
                  )}

                  {/* -------------------------------- */}
                  {/* REACTION BAR */}
                  {/* -------------------------------- */}

                  {activeReactionMessage ===
                    message._id && (
                    <div
                      className={`
                        absolute
                        z-[100]
                        flex items-center
                        gap-1
                        px-2 py-1.5
                        rounded-full
                        border
                        border-slate-700
                        bg-slate-900/95
                        backdrop-blur-xl
                        shadow-xl
                        animate-in
                        fade-in
                        zoom-in-95
                        duration-150

                        ${
                          reactionPlacement ===
                          "left"
                            ? "right-full mr-2 top-1/2 -translate-y-1/2"
                            : reactionPlacement ===
                              "right"
                            ? "left-full ml-2 top-1/2 -translate-y-1/2"
                            : `bottom-full mb-2 ${
                                own
                                  ? "right-0"
                                  : "left-0"
                              }`
                        }
                      `}
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      {reactions.map(
                        (emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                              handleReaction(
                                message._id,
                                emoji
                              )
                            }
                            className="
                              w-8 h-8
                              flex items-center
                              justify-center
                              rounded-full
                              text-base
                              hover:bg-slate-800
                              hover:scale-125
                              active:scale-90
                              transition-all
                            "
                          >
                            {emoji}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* -------------------------------- */}
                  {/* MESSAGE BUBBLE */}
                  {/* -------------------------------- */}

                  <div
                    className={`
                      relative
                      px-4 py-2.5
                      rounded-2xl
                      shadow-sm
                      ${
                        own
                          ? "bg-green-800 text-white rounded-br-md"
                          : "bg-teal-700 text-slate-200 rounded-bl-md"
                      }
                      ${
                        isSelected
                          ? "ring-2 ring-cyan-400"
                          : ""
                      }
                    `}
                    onClick={(event) => {
                      event.stopPropagation();

                      if (isSelectionMode) {
                        toggleMessageSelection(
                          message._id
                        );

                        return;
                      }

                      if (
                        activeReactionMessage ===
                        message._id
                      ) {
                        setActiveReactionMessage(
                          null
                        );

                        return;
                      }

                      const placement =
                        getMessageMenuPlacement(
                          message._id,
                          own
                        );

                      setReactionPlacement(
                        placement
                      );

                      setActiveReactionMessage(
                        message._id
                      );
                    }}
                  >
                    {/* -------------------------------- */}
                    {/* IMAGE */}
                    {/* -------------------------------- */}

                    {message.image && (
                      <a
                        href={message.image}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <img
                          src={message.image}
                          alt="attachment"
                          className="
                            max-w-full
                            max-h-[300px]
                            rounded-xl
                            mb-2
                            object-cover
                            cursor-pointer
                            select-none
                          "
                        />
                      </a>
                    )}

                    {/* -------------------------------- */}
                    {/* PDF */}
                    {/* -------------------------------- */}

                    {message.pdf && (
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          p-3
                          mb-2
                          rounded-xl
                          bg-black/20
                          border
                          border-white/10
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-center
                            w-10 h-10
                            rounded-lg
                            bg-red-500/10
                            text-red-400
                          "
                        >
                          <FileTextIcon className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className="
                              text-sm
                              font-medium
                              truncate
                            "
                          >
                            {message.pdfName ||
                              "Document.pdf"}
                          </p>

                         <a
  href={`${import.meta.env.VITE_API_URL}/messages/download-pdf/${message._id}`}
  target="_blank"
  rel="noreferrer"
  className="
    inline-flex
    items-center
    gap-1
    mt-1
    text-xs
    text-cyan-300
    hover:text-cyan-200
  "
  onClick={(event) =>
    event.stopPropagation()
  }
>
                            <DownloadIcon className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      </div>
                    )}

                    {/* -------------------------------- */}
                    {/* TEXT */}
                    {/* -------------------------------- */}

                    {message.text && (
                      <p
                        className="
                          whitespace-pre-wrap
                          break-words
                          text-sm
                          leading-relaxed
                        "
                      >
                        {message.text}
                      </p>
                    )}

                   
{/* TIME + MESSAGE STATUS */}
{/* -------------------------------- */}
<div
  className={`
    flex
    items-center
    justify-end
    gap-1
    mt-1
  `}
>
  <p
    className={`
      text-[10px]
      ${
        own
          ? "text-green-200/70"
          : "text-slate-300/70"
      }
    `}
  >
    {new Date(
      message.createdAt
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </p>

  {/* WhatsApp-style ticks */}
  {own && (
    <span
      className={`
        text-[12px]
        font-semibold
        leading-none
        tracking-[-4px]
        ${
          getMessageStatus(message) === "read"
            ? "text-sky-400"
            : "text-green-200/80"
        }
      `}
      title={
        getMessageStatus(message) === "read"
          ? "Read"
          : getMessageStatus(message) === "delivered"
          ? "Delivered"
          : "Sent"
      }
    >
      {getMessageStatus(message) === "sent"
        ? "✓"
        : "✓✓"}
    </span>
  )}
</div>
                  </div>

                  {/* -------------------------------- */}
                  {/* EXISTING REACTIONS */}
                  {/* -------------------------------- */}

                  {message.reactions?.length >
                    0 && (
                    <div
                      className="
                        flex
                        flex-wrap
                        gap-1
                        mt-1
                        px-1
                      "
                    >
                      {message.reactions.map(
                        (
                          reaction,
                          index
                        ) => (
                          <button
                            key={`${reaction.userId}-${index}`}
                            type="button"
                            onClick={() =>
                              handleReaction(
                                message._id,
                                reaction.emoji
                              )
                            }
                            className="
                              flex
                              items-center
                              justify-center
                              min-w-7
                              h-7
                              px-1.5
                              rounded-full
                              bg-slate-800
                              border
                              border-slate-700
                              text-sm
                              hover:scale-110
                              transition-transform
                            "
                          >
                            {
                              reaction.emoji
                            }
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={messageEndRef} />
      </div>

      {/* -------------------------------- */}
      {/* MESSAGE INPUT */}
      {/* -------------------------------- */}

      <MessageInput />

      {/* -------------------------------- */}
      {/* MOBILE LONG PRESS ACTION SHEET */}
      {/* -------------------------------- */}

      {showMobileActions &&
        mobileActionMessage && (
          <div
            className="
              fixed
              inset-0
              z-[200]
              bg-black/60
              backdrop-blur-sm
              flex
              items-end
              sm:hidden
            "
            onClick={() =>
              setShowMobileActions(false)
            }
          >
            <div
              className="
                w-full
                bg-slate-900
                border-t
                border-slate-700
                rounded-t-3xl
                p-4
                pb-6
                shadow-[0_-15px_50px_rgba(0,0,0,0.5)]
                animate-in
                slide-in-from-bottom
                duration-200
              "
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              {/* HEADER */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  pb-4
                  border-b
                  border-slate-700
                "
              >
                <div
                  className="
                    w-10 h-10
                    rounded-xl
                    bg-slate-800
                    flex
                    items-center
                    justify-center
                  "
                >
                  💬
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">
                    Message options
                  </p>

                  <p className="text-sm text-white truncate mt-0.5">
                    {mobileActionMessage.text ||
                      (mobileActionMessage.image
                        ? "📷 Image"
                        : mobileActionMessage.pdf
                        ? "📄 Document"
                        : "Message")}
                  </p>
                </div>
              </div>

              {/* -------------------------------- */}
              {/* REACT */}
              {/* -------------------------------- */}

              <button
                type="button"
                onClick={() => {
                  const own =
                    isOwnMessage(
                      mobileActionMessage
                    );

                  const placement =
                    getMessageMenuPlacement(
                      mobileActionMessage._id,
                      own
                    );

                  setReactionPlacement(
                    placement
                  );

                  setShowMobileActions(
                    false
                  );

                  setActiveReactionMessage(
                    mobileActionMessage._id
                  );

                  setMobileActionMessage(
                    null
                  );
                }}
                className="
                  w-full
                  flex
                  items-center
                  gap-4
                  px-4
                  py-4
                  rounded-2xl
                  text-left
                  text-slate-200
                  active:bg-slate-800
                  transition-colors
                "
              >
                <span
                  className="
                    w-11 h-11
                    rounded-xl
                    bg-yellow-500/10
                    border
                    border-yellow-500/20
                    flex
                    items-center
                    justify-center
                    text-xl
                  "
                >
                  ❤️
                </span>

                <div>
                  <p className="text-sm font-medium text-white">
                    React
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Add a reaction
                  </p>
                </div>
              </button>

              {/* -------------------------------- */}
              {/* SELECT */}
              {/* -------------------------------- */}

              <button
                type="button"
                onClick={() => {
                  toggleMessageSelection(
                    mobileActionMessage._id
                  );

                  setShowMobileActions(
                    false
                  );

                  setMobileActionMessage(
                    null
                  );
                }}
                className="
                  w-full
                  flex
                  items-center
                  gap-4
                  px-4
                  py-4
                  rounded-2xl
                  text-left
                  text-slate-200
                  active:bg-slate-800
                  transition-colors
                "
              >
                <span
                  className="
                    w-11 h-11
                    rounded-xl
                    bg-cyan-500/10
                    border
                    border-cyan-500/20
                    flex
                    items-center
                    justify-center
                    text-lg
                    text-cyan-400
                  "
                >
                  ✓
                </span>

                <div>
                  <p className="text-sm font-medium text-white">
                    Select
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Select this message
                  </p>
                </div>
              </button>

              {/* -------------------------------- */}
              {/* DELETE */}
              {/* -------------------------------- */}

              <button
                type="button"
                onClick={() => {
                  setShowMobileActions(
                    false
                  );

                  setSelectedMessages([
                    mobileActionMessage._id,
                  ]);

                  setIsSelectionMode(
                    true
                  );

                  setMobileActionMessage(
                    null
                  );

                  setTimeout(() => {
                    setDeleteMenuOpen(
                      true
                    );
                  }, 100);
                }}
                className="
                  w-full
                  flex
                  items-center
                  gap-4
                  px-4
                  py-4
                  rounded-2xl
                  text-left
                  text-red-400
                  active:bg-red-500/10
                  transition-colors
                "
              >
                <span
                  className="
                    w-11 h-11
                    rounded-xl
                    bg-red-500/10
                    border
                    border-red-500/20
                    flex
                    items-center
                    justify-center
                    text-lg
                  "
                >
                  🗑️
                </span>

                <div>
                  <p className="text-sm font-medium">
                    Delete
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Remove this message
                  </p>
                </div>
              </button>

              {/* -------------------------------- */}
              {/* CANCEL */}
              {/* -------------------------------- */}

              <button
                type="button"
                onClick={() => {
                  setShowMobileActions(
                    false
                  );

                  setMobileActionMessage(
                    null
                  );
                }}
                className="
                  w-full
                  mt-2
                  py-3
                  rounded-2xl
                  bg-slate-800
                  text-slate-300
                  font-medium
                  active:bg-slate-700
                  transition-colors
                "
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      {/* -------------------------------- */}
      {/* SELECTED MESSAGE ACTION BAR */}
      {/* -------------------------------- */}

      {isSelectionMode &&
        selectedMessages.length > 0 && (
          <div
            className="
              fixed
              bottom-5
              left-1/2
              -translate-x-1/2
              z-[100]
              flex
              items-center
              gap-3
              px-4 py-3
              rounded-2xl
              border
              border-slate-700/70
              bg-slate-900/95
              backdrop-blur-xl
              shadow-[0_15px_50px_rgba(0,0,0,0.6)]
              animate-in
              fade-in
              slide-in-from-bottom-4
              duration-200
            "
          >
            {/* COUNT */}

            <div
              className="
                flex
                items-center
                justify-center
                min-w-9
                h-9
                px-2
                rounded-xl
                bg-cyan-500/10
                border
                border-cyan-500/20
                text-cyan-400
                text-sm
                font-semibold
              "
            >
              {selectedMessages.length}
            </div>

            {/* TEXT */}

            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">
                {selectedMessages.length ===
                1
                  ? "1 message selected"
                  : `${selectedMessages.length} messages selected`}
              </p>

              <p className="text-[11px] text-slate-500">
                Select an action
              </p>
            </div>

            {/* DELETE */}

            <button
              type="button"
              onClick={() =>
                setDeleteMenuOpen(true)
              }
              className="
                group
                flex
                items-center
                gap-2
                px-4 py-2.5
                rounded-xl
                bg-red-500/10
                border
                border-red-500/20
                text-red-400
                text-sm
                font-medium
                hover:bg-red-500
                hover:text-white
                hover:border-red-500
                active:scale-95
                transition-all
                duration-200
              "
            >
              <Trash2Icon
                className="
                  w-4 h-4
                  transition-transform
                  duration-200
                  group-hover:scale-110
                "
              />

              <span>
                Delete
              </span>
            </button>

            {/* CANCEL */}

            <button
              type="button"
              onClick={cancelSelection}
              className="
                px-3 py-2.5
                rounded-xl
                text-slate-400
                hover:text-white
                hover:bg-slate-800
                transition-colors
              "
            >
              ✕
            </button>
          </div>
        )}

      {/* -------------------------------- */}
      {/* DELETE CONFIRMATION */}
      {/* -------------------------------- */}

      {deleteMenuOpen && (
        <div
          className="
            fixed
            inset-0
            z-[250]
            flex
            items-end
            sm:items-center
            justify-center
            bg-black/60
            backdrop-blur-sm
            p-0
            sm:p-4
          "
          onClick={() =>
            setDeleteMenuOpen(false)
          }
        >
          <div
            className="
              w-full
              max-w-sm
              rounded-t-3xl
              sm:rounded-3xl
              border
              border-slate-700/70
              bg-slate-900
              shadow-[0_20px_60px_rgba(0,0,0,0.7)]
              overflow-hidden
              animate-in
              slide-in-from-bottom-4
              sm:zoom-in-95
              duration-200
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* HEADER */}

            <div
              className="
                px-5
                py-5
                border-b
                border-slate-700/50
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    w-12
                    h-12
                    rounded-2xl
                    bg-red-500/10
                    border
                    border-red-500/20
                    text-red-400
                  "
                >
                  🗑️
                </div>

                <div>
                  <p className="text-base font-semibold text-white">
                    Delete message?
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {selectedMessages.length}{" "}
                    message
                    {selectedMessages.length >
                    1
                      ? "s"
                      : ""}{" "}
                    selected
                  </p>
                </div>
              </div>
            </div>

            {/* DELETE FOR ME */}

            <button
              type="button"
              onClick={
                handleDeleteForMe
              }
              className="
                w-full
                flex
                items-center
                gap-4
                px-5 py-4
                text-left
                text-slate-200
                hover:bg-slate-800
                active:bg-slate-800
                transition-colors
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-center
                  w-11 h-11
                  rounded-xl
                  bg-slate-800
                  border
                  border-slate-700
                "
              >
                <Trash2Icon className="w-5 h-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Delete for me
                </p>

                <p className="text-xs text-slate-500 mt-0.5">
                  Remove from your chat
                </p>
              </div>
            </button>

            {/* DELETE FOR EVERYONE */}

            {canDeleteForEveryone && (
              <button
                type="button"
                onClick={
                  handleDeleteForEveryone
                }
                className="
                  w-full
                  flex
                  items-center
                  gap-4
                  px-5 py-4
                  text-left
                  text-slate-200
                  hover:bg-red-500/10
                  active:bg-red-500/10
                  transition-colors
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    w-11 h-11
                    rounded-xl
                    bg-red-500/10
                    border
                    border-red-500/20
                    text-red-400
                  "
                >
                  <Trash2Icon className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Delete for everyone
                  </p>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Remove from both chats
                  </p>
                </div>
              </button>
            )}

            {/* CANCEL */}

            <button
              type="button"
              onClick={() =>
                setDeleteMenuOpen(false)
              }
              className="
                w-full
                px-5 py-4
                border-t
                border-slate-700/50
                text-sm
                font-medium
                text-slate-400
                hover:text-white
                hover:bg-slate-800
                transition-colors
              "
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatContainer;