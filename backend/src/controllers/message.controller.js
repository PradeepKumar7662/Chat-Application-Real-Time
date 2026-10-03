import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// ======================================================
// GET ALL CONTACTS
// ======================================================
export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET MESSAGES
// ======================================================
export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          receiverId: userToChatId,
        },
        {
          senderId: userToChatId,
          receiverId: myId,
        },
      ],

      // Don't show messages deleted for current user
      deletedFor: {
        $ne: myId,
      },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log(
      "Error in getMessages controller:",
      error.message
    );

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// ======================================================
// SEND MESSAGE
// ======================================================
export const sendMessage = async (req, res) => {
  try {
    const { text, image, pdf, pdfName } = req.body;

    const { id: receiverId } = req.params;

    const senderId = req.user._id;

    if (!text && !image && !pdf) {
      return res.status(400).json({
        message: "Text, image or PDF is required.",
      });
    }

    if (senderId.equals(receiverId)) {
      return res.status(400).json({
        message: "Cannot send messages to yourself.",
      });
    }

    const receiverExists = await User.exists({
      _id: receiverId,
    });

    if (!receiverExists) {
      return res.status(404).json({
        message: "Receiver not found.",
      });
    }

    // ================= IMAGE =================
    let imageUrl;

    if (image) {
      const uploadResponse =
        await cloudinary.uploader.upload(image, {
          resource_type: "image",
        });

      imageUrl = uploadResponse.secure_url;
    }

    // ================= PDF =================
    let pdfUrl;

    if (pdf) {
      const uploadResponse =
        await cloudinary.uploader.upload(pdf, {
          resource_type: "raw",
        });

      pdfUrl = uploadResponse.secure_url;
    }

    // ================= CREATE MESSAGE =================
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl || null,
      pdf: pdfUrl || null,
      pdfName: pdfName || null,
      reactions: [],
    });

    await newMessage.save();

    // ================= SOCKET =================
    const receiverSocketId =
      getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "newMessage",
        newMessage
      );
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log(
      "Error in sendMessage controller:",
      error.message
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// ======================================================
// DOWNLOAD PDF
// ======================================================
export const downloadPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message || !message.pdf) {
      return res.status(404).json({
        message: "PDF not found",
      });
    }

    // ================= AUTHORIZATION =================
    const myId = req.user._id.toString();

    const isParticipant =
      message.senderId.toString() === myId ||
      message.receiverId.toString() === myId;

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const response = await fetch(message.pdf);

    if (!response.ok) {
      return res.status(404).json({
        message: "Unable to fetch PDF",
      });
    }

    const pdfBuffer = Buffer.from(
      await response.arrayBuffer()
    );

    const safeFileName = (
      message.pdfName || "document.pdf"
    ).replace(/[\r\n"]/g, "_");

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFileName}"`
    );

    res.setHeader(
      "Content-Length",
      pdfBuffer.length
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.log(
      "Error downloading PDF:",
      error.message
    );

    res.status(500).json({
      message: "Failed to download PDF",
    });
  }
};

// ======================================================
// GET CHAT PARTNERS
// ======================================================
export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        {
          senderId: loggedInUserId,
        },
        {
          receiverId: loggedInUserId,
        },
      ],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() ===
          loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({
      _id: { $in: chatPartnerIds },
    }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    console.error(
      "Error in getChatPartners:",
      error.message
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// ======================================================
// REACT TO MESSAGE
// ======================================================
export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;

    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({
        message: "Emoji is required",
      });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    // ================= PARTICIPANT CHECK =================
    const isParticipant =
      message.senderId.toString() ===
        userId.toString() ||
      message.receiverId.toString() ===
        userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // ================= FIND EXISTING REACTION =================
    const existingReaction =
      message.reactions.find(
        (reaction) =>
          reaction.userId.toString() ===
          userId.toString()
      );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Remove reaction
        message.reactions =
          message.reactions.filter(
            (reaction) =>
              reaction.userId.toString() !==
              userId.toString()
          );
      } else {
        // Change reaction
        existingReaction.emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({
        userId,
        emoji,
      });
    }

    await message.save();

    res.status(200).json(message);
  } catch (error) {
    console.log(
      "Error in reactToMessage:",
      error.message
    );

    res.status(500).json({
      message: "Failed to react to message",
    });
  }
};

// ======================================================
// DELETE MESSAGE FOR EVERYONE
// ======================================================
export const deleteMessageForMe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    const isParticipant =
      message.senderId.toString() === userId.toString() ||
      message.receiverId.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const alreadyDeleted = message.deletedFor.some(
      (id) => id.toString() === userId.toString()
    );

    if (!alreadyDeleted) {
      message.deletedFor.push(userId);
      await message.save();
    }

    const socketId = getReceiverSocketId(
      userId.toString()
    );

    if (socketId) {
      io.to(socketId).emit("messageDeletedForMe", id);
    }

    res.status(200).json({
      message: "Message deleted for you",
      messageId: id,
    });
  } catch (error) {
    console.log(
      "Error in deleteMessageForMe:",
      error.message
    );

    res.status(500).json({
      message: "Failed to delete message",
    });
  }
};


export const deleteMultipleMessagesForMe = async (
  req,
  res
) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    if (
      !Array.isArray(messageIds) ||
      messageIds.length === 0
    ) {
      return res.status(400).json({
        message: "Message IDs are required",
      });
    }

    const messages = await Message.find({
      _id: { $in: messageIds },

      $or: [
        { senderId: userId },
        { receiverId: userId },
      ],
    });

    if (messages.length === 0) {
      return res.status(404).json({
        message: "Messages not found",
      });
    }

    await Message.updateMany(
      {
        _id: {
          $in: messages.map((message) => message._id),
        },
      },
      {
        $addToSet: {
          deletedFor: userId,
        },
      }
    );

    const socketId = getReceiverSocketId(
      userId.toString()
    );

    if (socketId) {
      io.to(socketId).emit(
        "messagesDeletedForMe",
        messageIds
      );
    }

    res.status(200).json({
      message: "Messages deleted for you",
      messageIds,
    });
  } catch (error) {
    console.log(
      "Error in deleteMultipleMessagesForMe:",
      error.message
    );

    res.status(500).json({
      message: "Failed to delete messages",
    });
  }
};

export const deleteMessagesForEveryone = async (
  req,
  res
) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    if (
      !Array.isArray(messageIds) ||
      messageIds.length === 0
    ) {
      return res.status(400).json({
        message: "Message IDs are required",
      });
    }

    const messages = await Message.find({
      _id: { $in: messageIds },
    });

    if (messages.length === 0) {
      return res.status(404).json({
        message: "Messages not found",
      });
    }

    // Only sender can delete for everyone
    const unauthorized = messages.some(
      (message) =>
        message.senderId.toString() !==
        userId.toString()
    );

    if (unauthorized) {
      return res.status(403).json({
        message:
          "Only the sender can delete messages for everyone.",
      });
    }

    const receiverIds = [
      ...new Set(
        messages.map((message) =>
          message.receiverId.toString()
        )
      ),
    ];

    await Message.deleteMany({
      _id: { $in: messageIds },
    });

    // Notify receivers
    receiverIds.forEach((receiverId) => {
      const socketId =
        getReceiverSocketId(receiverId);

      if (socketId) {
        io.to(socketId).emit(
          "messagesDeletedForEveryone",
          messageIds
        );
      }
    });

    // Notify sender
    const senderSocketId =
      getReceiverSocketId(userId.toString());

    if (senderSocketId) {
      io.to(senderSocketId).emit(
        "messagesDeletedForEveryone",
        messageIds
      );
    }

    res.status(200).json({
      message: "Messages deleted for everyone",
      messageIds,
    });
  } catch (error) {
    console.log(
      "Error in deleteMessagesForEveryone:",
      error.message
    );

    res.status(500).json({
      message: "Failed to delete messages",
    });
  }
};

