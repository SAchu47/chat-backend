import express from "express";
import {
  LoginUser,
  registerUser,
  updateUser,
  allUsers,
} from "../controllers/userControllers.js";
import { checkAuthorization } from "../middleware/checkAuthorization.js";

const router = express.Router();

router.route("/register").post(checkAuthorization, registerUser);
router.route("/update/:id").put(checkAuthorization, updateUser);
router.route("/login").post(LoginUser);
router.route("").get(checkAuthorization, allUsers);

export default router;
