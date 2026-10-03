import express from "express";

import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  downloadPdf,
  reactToMessage,
  deleteMessageForMe,
  deleteMultipleMessagesForMe,
  deleteMessagesForEveryone,
} from "../controllers/message.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(
  arcjetProtection,
  protectRoute
);

router.get("/contacts", getAllContacts);

router.get("/chats", getChatPartners);

router.post("/react/:id", reactToMessage);

router.get(
  "/download-pdf/:id",
  downloadPdf
);

// Delete for me - single
router.delete(
  "/delete-for-me/:id",
  deleteMessageForMe
);

// Delete for me - multiple
router.delete(
  "/delete-for-me",
  deleteMultipleMessagesForMe
);

// Delete for everyone - single/multiple
router.delete(
  "/delete-for-everyone",
  deleteMessagesForEveryone
);

router.get("/:id", getMessagesByUserId);

router.post("/send/:id", sendMessage);

export default router;