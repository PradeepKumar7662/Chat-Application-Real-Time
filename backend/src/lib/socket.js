import { Server } from "socket.io";
import http from "http";
import express from "express";

import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

// Apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// Store online users
const userSocketMap = {}; // { userId: socketId }

// Get receiver socket ID
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.user.fullName);

  const userId = socket.userId;

  // Store user's socket ID
  userSocketMap[userId] = socket.id;

  // Send online users to everyone
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ---------------------------------------------
  // MESSAGE DELIVERED
  // ---------------------------------------------

  socket.on("messageDelivered", async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);

      if (!message) return;

      // Only receiver can mark the message as delivered
      if (message.receiverId.toString() !== userId.toString()) {
        return;
      }

      if (!message.isDelivered) {
        message.isDelivered = true;
        message.deliveredAt = new Date();

        await message.save();
      }

      // Notify sender
      const senderSocketId = getReceiverSocketId(
        message.senderId.toString()
      );

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId: message._id,
        });
      }
    } catch (error) {
      console.log(
        "Error updating message delivery status:",
        error.message
      );
    }
  });

  // ---------------------------------------------
  // MESSAGE READ
  // ---------------------------------------------

  socket.on("messageRead", async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId);

      if (!message) return;

      // Only receiver can mark the message as read
      if (message.receiverId.toString() !== userId.toString()) {
        return;
      }

      if (!message.isRead) {
        message.isRead = true;
        message.readAt = new Date();

        // Read means it was also delivered
        if (!message.isDelivered) {
          message.isDelivered = true;
          message.deliveredAt = new Date();
        }

        await message.save();
      }

      // Notify sender
      const senderSocketId = getReceiverSocketId(
        message.senderId.toString()
      );

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageRead", {
          messageId: message._id,
        });
      }
    } catch (error) {
      console.log(
        "Error updating message read status:",
        error.message
      );
    }
  });

  // ---------------------------------------------
  // MULTIPLE MESSAGES READ
  // ---------------------------------------------

  socket.on("messagesRead", async ({ messageIds }) => {
    try {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return;
      }

      const messages = await Message.find({
        _id: { $in: messageIds },
        receiverId: userId,
      });

      if (messages.length === 0) return;

      const now = new Date();

      const validMessageIds = messages.map(
        (message) => message._id
      );

      await Message.updateMany(
        {
          _id: { $in: validMessageIds },
          receiverId: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: now,
            isDelivered: true,
            deliveredAt: now,
          },
        }
      );

      // Group messages by sender
      const senderGroups = {};

      messages.forEach((message) => {
        const senderId = message.senderId.toString();

        if (!senderGroups[senderId]) {
          senderGroups[senderId] = [];
        }

        senderGroups[senderId].push(message._id);
      });

      // Notify each sender
      Object.entries(senderGroups).forEach(
        ([senderId, messageIdsForSender]) => {
          const senderSocketId =
            getReceiverSocketId(senderId);

          if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", {
              messageIds: messageIdsForSender,
            });
          }
        }
      );
    } catch (error) {
      console.log(
        "Error updating multiple messages read status:",
        error.message
      );
    }
  });

  // ---------------------------------------------
  // DISCONNECT
  // ---------------------------------------------

  socket.on("disconnect", () => {
    console.log(
      "A user disconnected:",
      socket.user.fullName
    );

    delete userSocketMap[userId];

    io.emit(
      "getOnlineUsers",
      Object.keys(userSocketMap)
    );
  });
});

export { io, app, server };