import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const [ACCESS_SECRET_KEY, ACCESS_SECRET_TIME] = [
  process.env.ACCESS_SECRET_KEY,
  process.env.ACCESS_SECRET_TIME,
];

export const getAccessToken = (user) => {
  const accessToken = jwt.sign(
    {
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      _id: user._id,
    },
    ACCESS_SECRET_KEY,
    {
      // expiresIn: ACCESS_SECRET_TIME + user._id
      expiresIn: ACCESS_SECRET_TIME,
    }
  );
  return accessToken;
};

export const getUserToken = (user) => {
  const accessTokenKey = jwt.sign(
    {
      userId: user._id,
    },
    ACCESS_SECRET_KEY,
    {
      expiresIn: ACCESS_SECRET_TIME,
    }
  );
  return accessTokenKey;
};

export const verifyToken = (token, key) => {
  try {
    const payload = jwt.verify(token, key);
    return payload;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const getCookieOptions = (TTL) => ({
  maxAge: TTL,
  httpOnly: true,
  secure: false,
  sameSite: "None",
});
