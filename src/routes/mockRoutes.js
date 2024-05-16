import express from "express";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import { RESPONSE } from "../config/constantResponse.js";
import responseBuilder from "../config/responseBuilder.js";
import Logging from "../config/consoleLogging.js";

const router = express.Router();

router.route("/").post(async (req, res) => {
  await User.create({
    name: "admin1",
    email: "admin1@wechat.com",
    password: "iamadmin1",
    isAdmin: true,
  }).then((user) => {
    if (user) {
      const data = {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      };
      return res
        .status(201)
        .json(responseBuilder(true, RESPONSE.CREATED, data));
    } else {
      Logging.error("User not found");
      return res.status(400).json(responseBuilder(false, RESPONSE.NODATA));
    }
  });
});

export default router;
