import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV = "test";

//Require the dev-dependencies
import * as chai from "chai";
import chaiHttp from "chai-http";
import { server } from "../src/server.js";
import request from "supertest";
import mongoose from "mongoose";
import { config } from "../src/config/config.js";

chai.use(chaiHttp);

const should = chai.should();
const expect = chai.expect;

//login the user before we run any tests
let authenticatedUser = request.agent(server);
let adminToken, userId1, userId2, userId3, userToken, groupId, messageId;

describe("CHAT API TESTING", () => {
  console.log("URL:", config.mongo.url);
  after(async () => {
    await mongoose
      .connect(config.mongo.url, {
        retryWrites: true,
        w: "majority",
      })
      .then(async () => {
        // Drop the database after all tests are done
        await mongoose.connection.db.dropDatabase();
        await mongoose.disconnect();
      })
      .catch((error) => {
        console.log("ERROR DB:", error);
      });
  });

  // create admin
  it("it should create admin user", (done) => {
    authenticatedUser
      .post("/mock")
      .send({})
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("CREATED");
        done();
      });
  });

  //   login admin
  it("it should login admin", (done) => {
    authenticatedUser
      .post("/v1/user/login")
      .send({
        email: "admin1@wechat.com",
        password: "iamadmin1",
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("email")
          .eql("admin1@wechat.com");
        adminToken = res.body.payload.data.accessToken;
        done();
      });
  });

  // admin create user
  it("it should allow admin to create user", (done) => {
    authenticatedUser
      .post("/v1/user/register")
      .set("Authorization", "Bearer " + adminToken)
      .send({
        name: "user1",
        email: "user1@wechat.com",
        password: "iamuser1",
        isAdmin: false,
      })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("CREATED");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("email")
          .eql("user1@wechat.com");
        done();
      });
  });

  //   login user
  it("it should login user", (done) => {
    authenticatedUser
      .post("/v1/user/login")
      .send({
        email: "user1@wechat.com",
        password: "iamuser1",
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("email")
          .eql("user1@wechat.com");
        userId1 = res.body.payload.data.data._id;
        userToken = res.body.payload.data.accessToken;
        done();
      });
  });

  // admin update user
  it("it should allow admin to update user", (done) => {
    authenticatedUser
      .put(`/v1/user/update/${userId1}`)
      .set("Authorization", "Bearer " + adminToken)
      .send({
        name: "newUser1",
      })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("DATA UPDATED");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have.property("name").eql("newUser1");
        done();
      });
  });

  // admin create user2
  it("it should allow admin to create user2", (done) => {
    authenticatedUser
      .post("/v1/user/register")
      .set("Authorization", "Bearer " + adminToken)
      .send({
        name: "user2",
        email: "user2@wechat.com",
        password: "iamuser2",
        isAdmin: false,
      })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("CREATED");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("email")
          .eql("user2@wechat.com");
        userId2 = res.body.payload.data.data._id;
        done();
      });
  });

  // admin create user3
  it("it should allow admin to create user3", (done) => {
    authenticatedUser
      .post("/v1/user/register")
      .set("Authorization", "Bearer " + adminToken)
      .send({
        name: "user3",
        email: "user3@wechat.com",
        password: "iamuser3",
        isAdmin: false,
      })
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("CREATED");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("email")
          .eql("user3@wechat.com");
        userId3 = res.body.payload.data.data._id;
        done();
      });
  });

  // user search user
  it("it should allow user to search users", (done) => {
    authenticatedUser
      .get("/v1/user?search=us")
      .set("Authorization", "Bearer " + userToken)

      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        expect(res.body.payload.data.data).to.have.lengthOf(2);
        done();
      });
  });

  // user get chats
  it("it should allow user to get chats", (done) => {
    authenticatedUser
      .get("/v1/chat/")
      .set("Authorization", "Bearer " + userToken)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        expect(res.body.payload.data.data).to.have.lengthOf(0);
        done();
      });
  });

  // user start individual chat with user2
  it("it should allow user to start chat", (done) => {
    authenticatedUser
      .post("/v1/chat/")
      .set("Authorization", "Bearer " + userToken)
      .send({
        userId: userId2,
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("chatName")
          .eql("individualChat");
        done();
      });
  });

  // user start group chat
  it("it should allow user to start chat", (done) => {
    authenticatedUser
      .post("/v1/chat/group/")
      .set("Authorization", "Bearer " + userToken)
      .send({
        users: [userId2, userId3],
        name: "group1",
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("chatName")
          .eql("group1");
        expect(res.body.payload.data.data.users).to.have.lengthOf(3);
        groupId = res.body.payload.data.data._id;
        done();
      });
  });

  // user rename group chat
  it("it should allow user to rename group", (done) => {
    authenticatedUser
      .put("/v1/chat/group/rename/")
      .set("Authorization", "Bearer " + userToken)
      .send({
        chatId: groupId,
        chatName: "newGroup1",
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("chatName")
          .eql("newGroup1");
        res.body.payload.data.data.should.have.property("_id").eql(groupId);
        expect(res.body.payload.data.data.users).to.have.lengthOf(3);
        done();
      });
  });

  // user remove user from group chat
  it("it should allow user to remove user from group", (done) => {
    authenticatedUser
      .put("/v1/chat/group/remove/")
      .set("Authorization", "Bearer " + userToken)
      .send({
        chatId: groupId,
        userId: userId2,
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("chatName")
          .eql("newGroup1");
        res.body.payload.data.data.should.have.property("_id").eql(groupId);
        expect(res.body.payload.data.data.users).to.have.lengthOf(2);
        done();
      });
  });

  // user add user to group chat
  it("it should allow user to add user to group", (done) => {
    authenticatedUser
      .put("/v1/chat/group/add/")
      .set("Authorization", "Bearer " + userToken)
      .send({
        chatId: groupId,
        userId: userId2,
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.should.have
          .property("chatName")
          .eql("newGroup1");
        res.body.payload.data.data.should.have.property("_id").eql(groupId);
        expect(res.body.payload.data.data.users).to.have.lengthOf(3);
        done();
      });
  });

  // user start group chat
  it("it should allow user to send message in group chat", (done) => {
    authenticatedUser
      .post("/v1/message/")
      .set("Authorization", "Bearer " + userToken)
      .send({
        content: "How is it going there?",
        chatId: groupId,
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.chat.should.have
          .property("chatName")
          .eql("newGroup1");
        res.body.payload.data.data.should.have
          .property("content")
          .eql("How is it going there?");
        expect(res.body.payload.data.data.chat.users).to.have.lengthOf(3);
        messageId = res.body.payload.data.data._id;
        done();
      });
  });

  // user get group chat
  it("it should allow user to get message in group chat", (done) => {
    authenticatedUser
      .get(`/v1/message/${groupId}`)
      .set("Authorization", "Bearer " + userToken)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        expect(res.body.payload.data.data).to.have.lengthOf(1);
        res.body.payload.data.data[0].should.have
          .property("content")
          .eql("How is it going there?");
        done();
      });
  });

  // user liek a message chat
  it("it should allow user to like message in chat", (done) => {
    authenticatedUser
      .put("/v1/message/")
      .set("Authorization", "Bearer " + userToken)
      .send({
        messageId: messageId,
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("status").eql(true);
        res.body.payload.should.have.property("message").eql("SUCCESS");
        res.body.payload.data.should.have.property("accessToken");
        res.body.payload.data.data.chat.should.have
          .property("chatName")
          .eql("newGroup1");
        res.body.payload.data.data.should.have
          .property("content")
          .eql("How is it going there?");
        expect(res.body.payload.data.data.likedBy).to.have.lengthOf(1);
        done();
      });
  });
});
