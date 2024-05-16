import { RESPONSE } from "../config/constantResponse.js";
import dotenv from "dotenv";
import Logging from "../config/consoleLogging.js";
import responseBuilder from "../config/responseBuilder.js";
dotenv.config();
import { getAccessToken, verifyToken } from "../config/auth.js";

// secret keys and secret times
const [ACCESS_SECRET_KEY] = [process.env.ACCESS_SECRET_KEY];

// check if the user has logged in before using the services
export const checkAuthorization = async (req, res, next) => {
  try {
    // bearer token
    let token = req.headers.authorization.split(" ")[1];
    // get the cookies
    // let userId = req.cookies._chatwithme_un;
    let payload;

    // userId is stored signed with JWT_KEY in cookie for security
    // try {
    //   userId = verifyToken(userId, ACCESS_SECRET_KEY).userId;
    // } catch (err) {
    //   Logging.error(`Key Not Provided: ${err}`);
    //   return res.status(401).json(responseBuilder(false, RESPONSE.AUTHERROR));
    // }
    // verify accessToken  with server
    try {
      // verifyToken(token, ACCESS_SECRET_KEY + userId);
      payload = verifyToken(token, ACCESS_SECRET_KEY);
    } catch (err) {
      // res.clearCookie("_chatwithme_un");
      Logging.error(`Token Man Handled: ${err}`);
      return res.status(401).json(responseBuilder(false, RESPONSE.AUTHERROR));
    }

    // if accessToken verified
    if (payload) {
      // payload._id = userId;

      // if the refreshJwtToken worked so set new tokens
      token = getAccessToken(payload);
    }

    // pass accessToken
    req.accessToken = token;

    // returning the payload
    req.user = payload;

    // continue the control-flow of the code or call the next middleware
    next();
  } catch (error) {
    // token was expired or user had made changes in the token
    Logging.error(error);
    return res.status(401).json(responseBuilder(false, RESPONSE.AUTHERROR));
  }
};
