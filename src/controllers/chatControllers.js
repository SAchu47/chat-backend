import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";
import { RESPONSE } from "../config/constantResponse.js";
import responseBuilder from "../config/responseBuilder.js";
import Logging from "../config/consoleLogging.js";

//@description     Create or fetch One to One Chat
//@route           POST /v1/chat/
//@access          Protected
export const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    Logging.error("UserId param not sent with request");
    return res
      .status(400)
      .json(responseBuilder(false, RESPONSE.MISSING, {}, req.accessToken));
  }

  await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password -isAdmin -createdAt -updatedAt -__v")
    .populate("latestMessage")
    .then(async (chat) => {
      return await User.populate(chat, {
        path: "latestMessage.sender",
        select: "name email",
      });
    })
    .then(async (individualChat) => {
      if (individualChat.length > 0) {
        return res
          .status(200)
          .json(
            responseBuilder(
              true,
              RESPONSE.SUCCESS,
              individualChat[0],
              req.accessToken
            )
          );
      } else {
        let chatData = {
          chatName: "individualChat",
          isGroupChat: false,
          users: [req.user._id, userId],
        };

        await Chat.create(chatData).then(async (createdChat) => {
          const fullChat = await Chat.findOne({
            _id: createdChat._id,
          }).populate("users", "-password -isAdmin -createdAt -updatedAt -__v");
          return res
            .status(200)
            .json(
              responseBuilder(true, RESPONSE.SUCCESS, fullChat, req.accessToken)
            );
        });
      }
    })
    .catch((error) => {
      Logging.error("Access Chat Failed");
      Logging.error(error);
      return res
        .status(400)
        .json(responseBuilder(false, RESPONSE.FAILED, {}, req.accessToken));
    });
});

//@description     Fetch all chats for a user
//@route           GET /v1/chat/
//@access          Protected
export const fetchChats = asyncHandler(async (req, res) => {
  await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
    .populate("users", "-password -isAdmin -createdAt -updatedAt -__v")
    .populate("groupAdmin", "-password -isAdmin -createdAt -updatedAt -__v")
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async (results) => {
      results = await User.populate(results, {
        path: "latestMessage.sender",
        select: "name email",
      });
      return res
        .status(200)
        .json(
          responseBuilder(true, RESPONSE.SUCCESS, results, req.accessToken)
        );
    })
    .catch((error) => {
      Logging.error("Fetch Chat Failed");
      Logging.error(error);
      return res
        .status(400)
        .json(responseBuilder(false, RESPONSE.FAILED, {}, req.accessToken));
    });
});

//@description     Create New Group Chat
//@route           POST /v1/chat/group
//@access          Protected
export const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res
      .status(400)
      .json(responseBuilder(false, RESPONSE.MISSING, {}, req.accessToken));
  }

  if (req.body.users.length < 2) {
    return res
      .status(400)
      .json(
        responseBuilder(false, RESPONSE.REQIREMENTNOTMET, {}, req.accessToken)
      );
  }

  req.body.users.push(req.user._id);

  await Chat.create({
    chatName: req.body.name,
    users: req.body.users,
    isGroupChat: true,
    groupAdmin: req.user._id,
  })
    .then(async (groupChat) => {
      return await Chat.findOne({ _id: groupChat._id })
        .populate("users", "-password -isAdmin -createdAt -updatedAt -__v")
        .populate(
          "groupAdmin",
          "-password -isAdmin -createdAt -updatedAt -__v"
        );
    })
    .then((groupChatData) => {
      return res
        .status(200)
        .json(
          responseBuilder(
            true,
            RESPONSE.SUCCESS,
            groupChatData,
            req.accessToken
          )
        );
    })
    .catch((error) => {
      Logging.error("Create chat failed");
      Logging.error(error);
      return res
        .status(400)
        .json(responseBuilder(false, RESPONSE.FAILED, {}, req.accessToken));
    });
});

// @desc    Rename Group
// @route   PUT /v1/chat/group/rename
// @access  Protected
export const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password -isAdmin -createdAt -updatedAt -__v")
    .populate("groupAdmin", "-password -isAdmin -createdAt -updatedAt -__v")
    .then((renameData) => {
      if (!renameData) {
        Logging.error("Group not found");
        return res
          .status(400)
          .json(responseBuilder(false, RESPONSE.NODATA, {}, req.accessToken));
      } else {
        return res
          .status(200)
          .json(
            responseBuilder(true, RESPONSE.SUCCESS, renameData, req.accessToken)
          );
      }
    })
    .catch((error) => {
      Logging.error("Rename chat failed");
      Logging.error(error);
      return res
        .status(400)
        .json(responseBuilder(false, RESPONSE.FAILED, {}, req.accessToken));
    });
});

// @desc    Add user to Group
// @route   PUT /v1/chat/group/add
// @access  Protected
export const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password -isAdmin -createdAt -updatedAt -__v")
    .populate("groupAdmin", "-password -isAdmin -createdAt -updatedAt -__v")
    .then((addedData) => {
      if (!addedData) {
        Logging.error("Group not found");
        return res
          .status(404)
          .json(responseBuilder(false, RESPONSE.NODATA, {}, req.accessToken));
      } else {
        return res
          .status(200)
          .json(
            responseBuilder(true, RESPONSE.SUCCESS, addedData, req.accessToken)
          );
      }
    })
    .catch((error) => {
      Logging.error("Add user failed");
      Logging.error(error);
      return res
        .status(400)
        .json(responseBuilder(false, RESPONSE.FAILED, {}, req.accessToken));
    });
});

// @desc    Remove user from Group
// @route   PUT /v1/chat/group/remove
// @access  Protected
export const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password -isAdmin -createdAt -updatedAt -__v")
    .populate("groupAdmin", "-password -isAdmin -createdAt -updatedAt -__v")
    .then((removedData) => {
      if (!removedData) {
        Logging.error("Group not found");
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
              removedData,
              req.accessToken
            )
          );
      }
    })
    .catch((error) => {
      Logging.error("Add user failed");
      Logging.error(error);
      return res
        .status(400)
        .json(responseBuilder(false, RESPONSE.FAILED, {}, req.accessToken));
    });
});
