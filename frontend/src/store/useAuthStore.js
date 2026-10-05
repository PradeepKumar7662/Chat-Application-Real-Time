import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = API_URL.replace(/\/api\/?$/, "");

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  // ---------------------------------------------
  // CHECK AUTH
  // ---------------------------------------------

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });

      get().connectSocket();
    } catch (error) {
      console.log("Error in authCheck:", error);

      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // ---------------------------------------------
  // SIGNUP
  // ---------------------------------------------

  signup: async (data) => {
    set({ isSigningUp: true });

    try {
      const res = await axiosInstance.post("/auth/signup", data);

      set({ authUser: res.data });

      toast.success("Account created successfully!");

      get().connectSocket();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Signup failed"
      );
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ---------------------------------------------
  // LOGIN
  // ---------------------------------------------

  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post(
        "/auth/login",
        data
      );

      set({ authUser: res.data });

      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      console.error("Login error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to connect to server"
      );
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      set({ authUser: null });

      toast.success("Logged out successfully");

      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");

      console.log("Logout error:", error);
    }
  },

  // ---------------------------------------------
  // UPDATE PROFILE
  // ---------------------------------------------

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put(
        "/auth/update-profile",
        data
      );

      set({ authUser: res.data });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in update profile:", error);

      toast.error(
        error.response?.data?.message ||
          "Profile update failed"
      );
    }
  },

  // ---------------------------------------------
  // CONNECT SOCKET
  // ---------------------------------------------

  connectSocket: () => {
    const { authUser } = get();

    if (!authUser || get().socket?.connected) {
      return;
    }

    const socket = io(BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message
      );
    });

   socket.on("getOnlineUsers", (userIds) => {
  set({
    onlineUsers: Array.isArray(userIds) ? userIds : [],
  });
});

    socket.on("disconnect", (reason) => {
      console.log(
        "Socket disconnected:",
        reason
      );
    });
  },

  // ---------------------------------------------
  // DISCONNECT SOCKET
  // ---------------------------------------------

  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.disconnect();

      set({
        socket: null,
        onlineUsers: [],
      });
    }
  },
}));