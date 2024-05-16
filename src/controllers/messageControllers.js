import asyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";
import { RESPONSE } from "../config/constantResponse.js";
import responseBuilder from "../config/responseBuilder.js";
import Logging from "../config/consoleLogging.js";

//@description     Get all Messages
//@route           GET /v1/message/:chatId
//@access          Protected
export const allMessages = asyncHandler(async (req, res) => {
  await Message.find({ chat: req.params.chatId })
    .populate("sender", "name email")
    .populate("chat")
    .then((chats) => {
      return res
        .status(200)
        .json(responseBuilder(true, RESPONSE.SUCCESS, chats, req.accessToken));
    })
    .catch((err) => {
      Logging.error("No Data ound");
      return res
        .status(404)
        .json(responseBuilder(false, RESPONSE.NODATA, {}, req.accessToken));
    });
});

//@description     Create New Message
//@route           POST /v1/message/
//@access          Protected
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    Logging.error("Invalid data passed into request");
    return res
      .status(400)
      .json(responseBuilder(false, RESPONSE.MISSING, {}, req.accessToken));
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  await Message.create(newMessage)
    .then(async (message) => {
      return await message.populate([
        { path: "sender", select: "name " },
        { path: "chat" },
      ]);
    })
    .then(async (messageData) => {
      return await User.populate(messageData, {
        path: "chat.users",
        select: "name email",
      });
    })
    .then(async (messages) => {
      await Chat.findByIdAndUpdate(req.body.chatId, {
        latestMessage: messages,
      });
      return res
        .status(200)
        .json(
          responseBuilder(true, RESPONSE.SUCCESS, messages, req.accessToken)
        );
    })
    .catch((err) => {
      Logging.error("No Data ound");
      return res
        .status(200)
        .json(responseBuilder(false, RESPONSE.NODATA, {}, req.accessToken));
    });
});

// @desc    like a messgae
// @route   PUT /v1/message/
// @access  Protected
export const likeMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.body;

  await Message.findByIdAndUpdate(
    messageId,
    {
      $push: { likedBy: req.user._id },
    },
    {
      new: true,
    }
  )
    .populate("sender", "name email")
    .populate("chat")
    .populate("likedBy", "name email")
    .then((updatedData) => {
      if (!updatedData) {
        Logging.error("MMessage not found");
        return res
          .status(404)
          .json(responseBuilder(false, RESPONSE.NODATA, {}, req.accessToken));
      } else {
        return res
          .status(200)
          .json(
            responseBuilder(
              true,
              RESPONSE.SUCCESS,
              updatedData,
              req.accessToken
            )
          );
      }
    })
    .catch((error) => {
      Logging.error("Message like failed");
      Logging.error(error);
      return res
        .status(400)
        .json(responseBuilder(false, RESPONSE.FAILED, {}, req.accessToken));
    });
});
