import express from "express";
import {
  allMessages,
  sendMessage,
  likeMessage,
} from "../controllers/messageControllers.js";
import { checkAuthorization } from "../middleware/checkAuthorization.js";

const router = express.Router();

router.route("/:chatId").get(checkAuthorization, allMessages);
router.route("/").post(checkAuthorization, sendMessage);
router.route("/").put(checkAuthorization, likeMessage);

export default router;
