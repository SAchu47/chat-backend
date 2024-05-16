import express from "express";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
} from "../controllers/chatControllers.js";
import { checkAuthorization } from "../middleware/checkAuthorization.js";

const router = express.Router();

router.route("/").post(checkAuthorization, accessChat);
router.route("/").get(checkAuthorization, fetchChats);
router.route("/group").post(checkAuthorization, createGroupChat);
router.route("/group/rename").put(checkAuthorization, renameGroup);
router.route("/group/remove").put(checkAuthorization, removeFromGroup);
router.route("/group/add").put(checkAuthorization, addToGroup);

export default router;
