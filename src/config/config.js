import dotenv from "dotenv";

dotenv.config();

const MONGO_USERNAME = process.env.MONGO_USERNAME || "";
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || "";
const MONGO_URL_PROD = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@cluster0.menvh.mongodb.net/db`;

const SERVER_PORT = process.env.SERVER_PORT
  ? Number(process.env.SERVER_PORT)
  : 3000;
const MONGO_URL_DEV = "mongodb://localhost:27017/chat_api";
const MONGO_URL_TEST = "mongodb://localhost:27017/test_chat_api";

let MONGO_URL = MONGO_URL_PROD;
if (process.env.NODE_ENV === "dev") {
  MONGO_URL = MONGO_URL_DEV;
} else if (process.env.NODE_ENV === "test") {
  MONGO_URL = MONGO_URL_TEST;
} else {
  MONGO_URL = MONGO_URL_PROD;
}

export const config = {
  mongo: {
    username: MONGO_USERNAME,
    password: MONGO_PASSWORD,
    url: MONGO_URL,
  },
  server: {
    port: SERVER_PORT,
  },
};
