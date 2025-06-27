const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const session = require("express-session");
const logRoutes = require("../routes/logRoutes");
const request = require("supertest");
const StatusCodes = require("http-status-codes").StatusCodes;

const router = express.Router();
const MAX_AGE = 1000 * 60 * 60;

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
    cookie: { secure: false, maxAge: MAX_AGE },
  })
);
app.use("/log", logRoutes);

describe("Consumption log routes", () => {
  const testLog = {
    user_id: "2",
    item_id: "8",
    servings: "1",
  };

  beforeAll((done) => {
    const dbPath = path.resolve(__dirname, "../db/fridge.db");
    db = new sqlite3.Database(dbPath, done);
  });

  afterAll((done) => {
    db.run(
      "DELETE FROM consumption_logs WHERE user_id = ?",
      [testLog.user_id],
      function (err) {
        if (err) {
          return done(err);
        }
        db.close(done);
      }
    );
  });

  test("User logs item", async () => {
    const res = await request(app).post("/log").send(testLog);
    expect(res.statusCode).toBe(StatusCodes.CREATED);
    expect(res.body).toEqual({ message: "Created log", id: res.body.id });
  });

  test("User deletes log", async () => {
    const createRes = await request(app).post("/log").send(testLog);
    const createdLogId = createRes.body.id;
    const deleteRes = await request(app).delete(`/log/${createdLogId}`);
    expect(deleteRes.statusCode).toBe(StatusCodes.OK);
    expect(deleteRes.text).toBe("Deleted log");
  });
});
