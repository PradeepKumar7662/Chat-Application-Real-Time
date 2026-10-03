import { create } from "zustand";

import { axiosInstance } from "../lib/axios";

import toast from "react-hot-toast";

import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],

  chats: [],

  messages: [],

  activeTab: "chats",

  selectedUser: null,

  isUsersLoading: false,

  isMessagesLoading: false,

  isSoundEnabled:
    JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem(
      "isSoundEnabled",
      !get().isSoundEnabled
    );

    set({
      isSoundEnabled: !get().isSoundEnabled,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: (selectedUser) =>
    set({ selectedUser }),

  // ====================================================
  // GET ALL CONTACTS
  // ====================================================

  getAllContacts: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get(
        "/messages/contacts"
      );

      set({
        allContacts: res.data,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ====================================================
  // DELETE USER
  // ====================================================

  deleteUser: async (userId) => {
    try {
      await axiosInstance.delete(
        `/auth/delete/${userId}`
      );

      // User ko contact list se remove karo
      set({
        allContacts: get().allContacts.filter(
          (contact) => contact._id !== userId
        ),
      });

      toast.success("User deleted successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete user"
      );
    }
  },

  // ====================================================
  // GET MY CHAT PARTNERS
  // ====================================================

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get(
        "/messages/chats"
      );

      set({
        chats: res.data,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // ====================================================
  // GET MESSAGES
  // ====================================================

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(
        `/messages/${userId}`
      );

      set({
        messages: res.data,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ====================================================
  // SEND MESSAGE
  // ====================================================

  sendMessage: async (messageData) => {
    const {
      selectedUser,
    } = get();

    const {
      authUser,
    } = useAuthStore.getState();

    if (!selectedUser || !authUser) return;

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,

      senderId: authUser._id,

      receiverId: selectedUser._id,

      text: messageData.text || "",

      image: messageData.image || null,

      // PDF fields
      pdf: messageData.pdf || null,

      pdfName: messageData.pdfName || null,

      createdAt: new Date().toISOString(),

      // Message status
      isDelivered: false,

      deliveredAt: null,

      isRead: false,

      readAt: null,

      isOptimistic: true,
    };

    // Immediately update UI
    set((state) => ({
      messages: [
        ...state.messages,
        optimisticMessage,
      ],
    }));

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Replace only the optimistic message.
      // Baaki messages/status ko disturb nahi karega.
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId
            ? res.data
            : message
        ),
      }));
    } catch (error) {
      // Failed optimistic message remove karo
      set((state) => ({
        messages: state.messages.filter(
          (message) => message._id !== tempId
        ),
      }));

      toast.error(
        error.response?.data?.message ||
          "Something went wrong"
      );
    }
  },

  // ====================================================
  // SOCKET SUBSCRIPTION
  // ====================================================

  subscribeToMessages: () => {
    const {
      selectedUser,
      isSoundEnabled,
    } = get();

    if (!selectedUser) return;

    const socket =
      useAuthStore.getState().socket;

    if (!socket) return;

    // ==================================================
    // NEW MESSAGE
    // ==================================================

    socket.on(
      "newMessage",
      (newMessage) => {
        const isMessageSentFromSelectedUser =
          newMessage.senderId?.toString() ===
          selectedUser._id?.toString();

        if (!isMessageSentFromSelectedUser) return;

        const currentMessages =
          get().messages;

        set({
          messages: [
            ...currentMessages,
            newMessage,
          ],
        });

        // ==============================================
        // MESSAGE DELIVERED
        // ==============================================

        socket.emit(
          "messageDelivered",
          {
            messageId: newMessage._id,
          }
        );

        // ==============================================
        // MESSAGE READ
        // ==============================================

        // Chat currently open hai,
        // isliye message immediately read mark hoga.
        socket.emit(
          "messageRead",
          {
            messageId: newMessage._id,
          }
        );

        // ==============================================
        // NOTIFICATION SOUND
        // ==============================================

        if (isSoundEnabled) {
          const notificationSound =
            new Audio(
              "/sounds/notification.mp3"
            );

          notificationSound.currentTime = 0;

          notificationSound
            .play()
            .catch((e) =>
              console.log(
                "Audio play failed:",
                e
              )
            );
        }
      }
    );

    // ==================================================
    // MESSAGE DELIVERED
    // ==================================================

    socket.on(
      "messageDelivered",
      ({
        messageId,
        deliveredAt,
      }) => {
        set((state) => ({
          messages: state.messages.map(
            (message) =>
              message._id?.toString() ===
              messageId?.toString()
                ? {
                    ...message,

                    isDelivered: true,

                    deliveredAt:
                      deliveredAt ||
                      message.deliveredAt ||
                      new Date().toISOString(),
                  }
                : message
          ),
        }));
      }
    );

    // ==================================================
    // MESSAGE READ
    // ==================================================

    socket.on(
      "messageRead",
      ({
        messageId,
        readAt,
      }) => {
        set((state) => ({
          messages: state.messages.map(
            (message) =>
              message._id?.toString() ===
              messageId?.toString()
                ? {
                    ...message,

                    isDelivered: true,

                    isRead: true,

                    deliveredAt:
                      message.deliveredAt ||
                      readAt ||
                      new Date().toISOString(),

                    readAt:
                      readAt ||
                      new Date().toISOString(),
                  }
                : message
          ),
        }));
      }
    );

    // ==================================================
    // MULTIPLE MESSAGES READ
    // ==================================================

    socket.on(
      "messagesRead",
      ({
        messageIds,
      }) => {
        if (
          !Array.isArray(messageIds) ||
          messageIds.length === 0
        ) {
          return;
        }

        set((state) => ({
          messages: state.messages.map(
            (message) => {
              const isReadMessage =
                messageIds.some(
                  (id) =>
                    id?.toString() ===
                    message._id?.toString()
                );

              if (!isReadMessage) {
                return message;
              }

              return {
                ...message,

                isDelivered: true,

                isRead: true,

                deliveredAt:
                  message.deliveredAt ||
                  new Date().toISOString(),

                readAt:
                  message.readAt ||
                  new Date().toISOString(),
              };
            }
          ),
        }));
      }
    );
  },

  // ====================================================
  // UNSUBSCRIBE SOCKET EVENTS
  // ====================================================

  unsubscribeFromMessages: () => {
    const socket =
      useAuthStore.getState().socket;

    if (!socket) return;

    socket.off("newMessage");

    socket.off("messageDelivered");

    socket.off("messageRead");

    socket.off("messagesRead");
  },
}));