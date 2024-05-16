import express from "express";
import http from "http";
import mongoose from "mongoose";
import { config } from "./config/config.js";
import Logging from "./config/consoleLogging.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import mockRoutes from "./routes/mockRoutes.js";
import { RESPONSE } from "./config/constantResponse.js";
import responseBuilder from "./config/responseBuilder.js";
import cookiePraser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";

const router = express();

// Connect mongo
const mongooseConnection = async () => {
  await mongoose
    .connect(config.mongo.url, { retryWrites: true, w: "majority" })
    .then(() => {
      Logging.info("Connected to MongoDB");
    })
    .catch((error) => {
      Logging.error("Unable to Connect");
      Logging.error(error);
    });
};
mongooseConnection();

/** Log the request */
router.use((req, res, next) => {
  /** Log the req */
  Logging.info(
    `Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
  );

  res.on("finish", () => {
    /** Log the res */
    Logging.info(
      `Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`
    );
  });

  next();
});

router.use(cookiePraser());
router.use(express.urlencoded({ extended: true }));
router.use(express.json());
// Set up CORS middleware
router.use(
  cors({
    origin: "http://localhost:3001",
  })
);

/** Rules of our API */
router.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method == "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }

  next();
});

/** Routes */
router.use("/v1/user", userRoutes);
router.use("/v1/chat", chatRoutes);
router.use("/v1/message", messageRoutes);
// mock create admin
if (process.env.NODE_ENV !== "production") {
  router.use("/mock", mockRoutes);
}

/** Healthcheck */
router.get("/ping", (req, res, next) =>
  res
    .status(200)
    .json(responseBuilder(true, RESPONSE.SUCCESS, { hello: "world" }))
);

/** Error handling */
router.use((req, res, next) => {
  const error = new Error("Not found");

  Logging.error(error);
  Logging.error(error.message);

  res.status(404).json(responseBuilder(false, RESPONSE.NOROUTE));
});

export const server = http
  .createServer(router)
  .listen(config.server.port, () => {
    Logging.info(`Server is running on port ${config.server.port}`);
  });

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3001",
  },
});

io.on("connection", (socket) => {
  Logging.info("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    Logging.info("User Joined Room: " + room);
  });

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return Logging.error("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    Logging.info("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
