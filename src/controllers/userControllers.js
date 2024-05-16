import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import { RESPONSE } from "../config/constantResponse.js";
import responseBuilder from "../config/responseBuilder.js";
import Logging from "../config/consoleLogging.js";
import { getAccessToken } from "../config/auth.js";

//@description     Register new user
//@route           POST /v1/user/register
//@access          Admin
export const registerUser = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json(responseBuilder(false, RESPONSE.NOPERMISSION));
  }
  const { name, email, password, isAdmin } = req.body;

  if (!name || !email || !password) {
    Logging.error("Please Enter all the Feilds");
    return res.status(400).json(responseBuilder(false, RESPONSE.MISSING));
  }

  await User.findOne({ email }).then((userExists) => {
    if (userExists) {
      Logging.error("User already exists");
      return res.status(400).json(responseBuilder(false, RESPONSE.CONFLICT));
    }
  });

  await User.create({
    name,
    email,
    password,
    isAdmin,
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
        .json(responseBuilder(true, RESPONSE.CREATED, data, req.accessToken));
    } else {
      Logging.error("User not found");
      return res.status(400).json(responseBuilder(false, RESPONSE.NODATA));
    }
  });
});

//@description     Update user
//@route           POST /v1/user/update/:id
//@access          Admin
export const updateUser = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json(responseBuilder(false, RESPONSE.NOPERMISSION));
  }
  await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
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
        .json(responseBuilder(true, RESPONSE.UPDATE, data, req.accessToken));
    } else {
      Logging.error("Conflicting Data");
      return res
        .status(400)
        .json(responseBuilder(false, RESPONSE.CONFLICT, {}, req.accessToken));
    }
  });
});

//@description     Login user
//@route           POST /v1/user/login
//@access          Admin or User
export const LoginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  await User.findOne({ email }).then(async (user) => {
    if (user && (await user.matchPassword(password))) {
      const data = {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      };

      // res.cookie(
      //   "_chatwithme_un",
      //   getUserToken(user),
      //   getCookieOptions(604800000)
      // );
      return res
        .status(200)
        .json(
          responseBuilder(true, RESPONSE.SUCCESS, data, getAccessToken(user))
        );
    } else {
      Logging.error("Auth Error");
      return res.status(400).json(responseBuilder(false, RESPONSE.AUTHERROR));
    }
  });
});

//@description     Get or Search all users
//@route           GET /v1/user?search=
//@access          Admin/User
export const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select("name")
    .then((users) => {
      return res
        .status(200)
        .json(responseBuilder(true, RESPONSE.SUCCESS, users, req.accessToken));
    })
    .catch((err) => {
      Logging.error("No Data ound");
      return res
        .status(200)
        .json(responseBuilder(false, RESPONSE.NODATA, {}, req.accessToken));
    });
});
