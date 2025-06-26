const sqlite3 = require("sqlite3").verbose();
const path = require("path");
let db;

beforeAll((done) => {
  const dbPath = path.resolve(__dirname, "../db/fridge.db");
  db = new sqlite3.Database(dbPath, done);
});

afterAll((done) => {
  db.close(done);
});

test("Insert and retrieve a users row", (done) => {
  const user = {
    id: Date.now(),
    health_goal: "lose weight",
    dietary_preferences: "vegan",
    age: 28,
    weight_kg: 70,
    height_feet: 5,
    height_inches: 7,
    gender: "female",
    activity: "moderate",
    calorie_goal: 2000,
    protein_goal: 170,
    carb_goal: 200,
    fat_goal: 90,
  };
  db.run(
    `INSERT INTO users (id, health_goal, dietary_preferences, age, weight_kg, height_feet, height_inches, gender, activity, calorie_goal, protein_goal, carb_goal, fat_goal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.health_goal,
      user.dietary_preferences,
      user.age,
      user.weight_kg,
      user.height_feet,
      user.height_inches,
      user.gender,
      user.activity,
      user.calorie_goal,
      user.protein_goal,
      user.carb_goal,
      user.fat_goal,
    ],
    function (err) {
      if (err) return done(err);
      db.get(`SELECT * FROM users WHERE id = ?`, [user.id], (err, row) => {
        if (err) return done(err);
        try {
          expect(row).toBeDefined();
          // Ensure columns have the inserted data
          expect(row.health_goal).toBe(user.health_goal);
          expect(row.age).toBe(user.age);
          expect(row.weight_kg).toBe(user.weight_kg);
        } catch (e) {
          return done(e);
        }
        db.run(`DELETE FROM users WHERE id = ?`, [user.id], done);
      });
    }
  );
});

test("Insert and retrieve a users_auth row", (done) => {
  const testUsername = "test_user" + Date.now();
  const testPassword = "hashed_password";
  const testUserId = Date.now();
  db.run(
    `INSERT INTO users_auth (user_id, username, password) VALUES (?, ?, ?)`,
    [testUserId, testUsername, testPassword],
    function (err) {
      if (err) return done(err);
      db.get(
        `SELECT * FROM users_auth WHERE user_id = ?`,
        [testUserId],
        (err, row) => {
          if (err) return done(err);
          try {
            expect(row.username).toBe(testUsername);
            expect(row.password).toBe(testPassword);
          } catch (e) {
            return done(e);
          }
          db.run(
            `DELETE FROM users_auth WHERE user_id = ?`,
            [testUserId],
            done
          );
        }
      );
    }
  );
});

test("Insert and retrieve a food_items row", (done) => {
  const item = {
    id: 800,
    name: "banana",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fats: 0.4,
    sugars: 14,
  };
  db.run(
    `INSERT INTO food_items (id, name, calories, protein, carbs, fats, sugars) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.name,
      item.calories,
      item.protein,
      item.carbs,
      item.fats,
      item.sugars,
    ],
    function (err) {
      if (err) return done(err);
      db.get(`SELECT * FROM food_items WHERE id = ?`, [item.id], (err, row) => {
        if (err) return done(err);
        try {
          expect(row).toBeDefined();
          expect(row.id).toBe(item.id);
        } catch (e) {
          return done(e);
        }
        db.run(`DELETE FROM food_items WHERE id = ?`, [item.id], done);
      });
    }
  );
});

test("Insert and retrieve a consumption_logs row", (done) => {
  const log = {
    id: Date.now(),
    user_id: Date.now(),
    item_id: Date.now(),
    servings: 2,
    date_logged: "6/25/2025",
  };
  db.run(
    `INSERT INTO consumption_logs (id, user_id, item_id, servings, date_logged) VALUES (?, ?, ?, ?, ?)`,
    [log.id, log.user_id, log.item_id, log.servings, log.date_logged],
    function (err) {
      if (err) return done(err);
      db.get(
        `SELECT * FROM consumption_logs WHERE id = ?`,
        [log.id],
        (err, row) => {
          if (err) return done(err);
          try {
            expect(row).toBeDefined();
            expect(row.id).toBe(log.id);
          } catch (e) {
            return done(e);
          }
          db.run(`DELETE FROM consumption_logs WHERE id = ?`, [log.id], done);
        }
      );
    }
  );
});

test("Insert and retrieve a grocery_items row", (done) => {
  const item = {
    id: Date.now(),
    item_id: Date.now(),
    user_id: Date.now(),
    name: "Bread",
    quantity: 1,
    added_date: "6/25/2025",
    expiration_date: "7/01/2025",
  };
  db.run(
    `INSERT INTO grocery_items (id, item_id, user_id, name, quantity, added_date, expiration_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.item_id,
      item.user_id,
      item.name,
      item.quantity,
      item.added_date,
      item.expiration_date,
    ],
    function (err) {
      if (err) return done(err);
      db.get(
        `SELECT * FROM grocery_items WHERE id = ?`,
        [item.id],
        (err, row) => {
          if (err) return done(err);
          try {
            expect(row).toBeDefined();
            expect(row.id).toBe(item.id);
          } catch (e) {
            return done(e);
          }
          db.run(`DELETE FROM grocery_items WHERE id = ?`, [item.id], done);
        }
      );
    }
  );
});

test("Insert and retrieve a reminders row", (done) => {
  const reminder = {
    id: Date.now(),
    user_id: Date.now(),
    item_id: Date.now(),
    reminder_date: "6/28/2025",
    reminder_type: "Item expires",
    notified: "True",
  };
  db.run(
    `INSERT INTO reminders (id, user_id, item_id, reminder_date, reminder_type, notified) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      reminder.id,
      reminder.user_id,
      reminder.item_id,
      reminder.reminder_date,
      reminder.reminder_type,
      reminder.notified,
    ],
    function (err) {
      if (err) return done(err);
      db.get(
        `SELECT * FROM reminders WHERE id = ?`,
        [reminder.id],
        (err, row) => {
          if (err) return done(err);
          try {
            expect(row).toBeDefined();
            expect(row.id).toBe(reminder.id);
          } catch (e) {
            return done(e);
          }
          db.run(`DELETE FROM reminders WHERE id = ?`, [reminder.id], done);
        }
      );
    }
  );
});
