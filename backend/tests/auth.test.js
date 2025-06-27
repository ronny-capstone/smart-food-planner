const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const session = require("express-session");
const authRoutes = require("../routes/auth");
const request = require("supertest");

const router = express.Router();

let db;

const app = express();
app.use(router);
// Used to parse request bodies
app.use(express.json());
const agent = request.agent(app);

app.use(
  session({
    secret: "capstone-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 },
  })
);
app.use("/auth", authRoutes);

describe("Authentication routes", () => {
  const testUser = {
    username: "janedoe" + Date.now(),
    password: "testPassword12",
  };

  beforeAll((done) => {
    const dbPath = path.resolve(__dirname, "../db/fridge.db");
    db = new sqlite3.Database(dbPath, done);
  });

  afterAll((done) => {
    db.run(
      "DELETE FROM users_auth WHERE username = ?",
      [testUser.username],
      function (err) {
        if (err) {
          return done(err);
        }
        db.close(done);
      }
    );
  });

  test("User signs up", async () => {
    const res = await request(app).post("/auth/signup").send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.text).toBe("Signup successful!");
  });

  test("Sign in, missing username/password", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ username: "", password: "" });
    expect(res.statusCode).toBe(400);
    expect(res.text).toBe("Username and password are required.");
  });

  test("Sign in, password too short", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ username: "usertester", password: "123" });
    expect(res.statusCode).toBe(400);
    expect(res.text).toBe("Password must be at least 8 characters long.");
  });

  test("Sign in, username already taken", async () => {
    await request(app).post("/auth/signup").send(testUser);
    const res = await request(app).post("/auth/signup").send(testUser);
    expect(res.statusCode).toBe(400);
    expect(res.text).toBe("Username already taken");
  });

  test("User logs in", async () => {
    await request(app).post("/auth/signup").send(testUser);
    const res = await request(app).post("/auth/login").send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Login successful!");
  });

  test("Log in, missing username/password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "", password: "" });
    expect(res.statusCode).toBe(400);
    expect(res.text).toBe("Username and password are required");
  });

  test("Log in, invalid username/password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "nonexistent", password: "password123" });
    expect(res.statusCode).toBe(401);
    expect(res.text).toBe("Invalid username or password");
  });

  test("User not logged in, tries /me", async () => {
    const res = await agent.get("/auth/me");
    expect(res.statusCode).toBe(401);
    expect(res.text).toBe("Not logged in");
  });

  test("User is logged in, tries /me", async () => {
    // Agent maintains cookie information
    await agent.post("/auth/signup").send(testUser);
    await agent.post("/auth/login").send(testUser);
    const meRes = await agent.get("/auth/me");
    expect(meRes.statusCode).toBe(200);
    expect(meRes.body).toEqual({
      username: testUser.username,
    });
  });

  test("User logs out", async () => {
    await request(app).post("/auth/login").send(testUser);
    const res = await request(app).post("/auth/logout").send(testUser);
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Logout successful!");
  });
});
