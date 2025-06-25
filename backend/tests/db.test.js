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
    user_id: Date.now(),
    health_goal: "lose weight",
    dietary_preferences: "vegan",
    age: 28,
    weight_kg: 70,
    height_mtrs: 175,
    gender: "female",
    activity: "moderate",
    calorie_goal: 2000,
    protein_goal: 170,
    carb_goal: 200,
    fat_goal: 90,
  };
  db.run(
    `INSERT INTO users (user_id, health_goal, dietary_preferences, age, weight_kg, height_mtrs, gender, activity, calorie_goal, protein_goal, carb_goal, fat_goal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.user_id,
      user.health_goal,
      user.dietary_preferences,
      user.age,
      user.weight_kg,
      user.height_mtrs,
      user.gender,
      user.activity,
      user.calorie_goal,
      user.protein_goal,
      user.carb_goal,
      user.fat_goal,
    ],
    function (err) {
      expect(err).toBeNull();
      db.get(
        `SELECT * FROM users WHERE user_id = ?`,
        [user.user_id],
        (err, row) => {
          expect(err).toBeNull();
          expect(row).toBeDefined();
          db.run(`DELETE FROM users WHERE user_id = ?`, [user.user_id], done);
        }
      );
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
      expect(err).toBeNull();
      db.get(
        `SELECT * FROM users_auth WHERE user_id = ?`,
        [testUserId],
        (err, row) => {
          expect(err).toBeNull();
          expect(row).toBeDefined();
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
    item_id: 800,
    name: "banana",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fats: 0.4,
    sugars: 14,
  };
  db.run(
    `INSERT INTO food_items (item_id, name, calories, protein, carbs, fats, sugars) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.item_id,
      item.name,
      item.calories,
      item.protein,
      item.carbs,
      item.fats,
      item.sugars,
    ],
    function (err) {
      expect(err).toBeNull();
      db.get(
        `SELECT * FROM food_items WHERE item_id = ?`,
        [item.item_id],
        (err, row) => {
          expect(err).toBeNull();
          expect(row).toBeDefined();
          db.run(
            `DELETE FROM food_items WHERE item_id = ?`,
            [item.item_id],
            done
          );
        }
      );
    }
  );
});

test("Insert and retrieve a consumption_logs row", (done) => {
  const log = {
    log_id: Date.now(),
    user_id: Date.now(),
    food_id: Date.now(),
    servings: 2,
    date_logged: "6/25/2025",
  };
  db.run(
    `INSERT INTO consumption_logs (log_id, user_id, food_id, servings, date_logged) VALUES (?, ?, ?, ?, ?)`,
    [log.log_id, log.user_id, log.food_id, log.servings, log.date_logged],
    function (err) {
      expect(err).toBeNull();
      db.get(
        `SELECT * FROM consumption_logs WHERE log_id = ?`,
        [log.log_id],
        (err, row) => {
          expect(err).toBeNull();
          expect(row).toBeDefined();
          db.run(
            `DELETE FROM consumption_logs WHERE log_id = ?`,
            [log.log_id],
            done
          );
        }
      );
    }
  );
});

test("Insert and retrieve a grocery_items row", (done) => {
  const item = {
    item_id: Date.now(),
    user_id: Date.now(),
    name: "Bread",
    quantity: 1,
    added_date: "6/25/2025",
    expiration_date: "7/01/2025",
  };
  db.run(
    `INSERT INTO grocery_items (item_id, user_id, name, quantity, added_date, expiration_date) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      item.item_id,
      item.user_id,
      item.name,
      item.quantity,
      item.added_date,
      item.expiration_date,
    ],
    function (err) {
      expect(err).toBeNull();
      db.get(
        `SELECT * FROM grocery_items WHERE item_id = ?`,
        [item.item_id],
        (err, row) => {
          expect(err).toBeNull();
          expect(row).toBeDefined();
          db.run(
            `DELETE FROM grocery_items WHERE item_id = ?`,
            [item.item_id],
            done
          );
        }
      );
    }
  );
});

test("Insert and retrieve a reminders row", (done) => {
  const reminder = {
    reminder_id: Date.now(),
    user_id: Date.now(),
    food_name: "Eggs",
    reminder_date: "6/28/2025",
    reminder_type: "Item expires",
    notified: "True",
  };
  db.run(
    `INSERT INTO reminders (reminder_id, user_id, food_name, reminder_date, reminder_type, notified) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      reminder.reminder_id,
      reminder.user_id,
      reminder.food_name,
      reminder.reminder_date,
      reminder.reminder_type,
      reminder.notified,
    ],
    function (err) {
      expect(err).toBeNull();

      db.get(
        `SELECT * FROM reminders WHERE reminder_id = ?`,
        [reminder.reminder_id],
        (err, row) => {
          expect(err).toBeNull();
          expect(row).toBeDefined();
          db.run(
            `DELETE FROM reminders WHERE reminder_id = ?`,
            [reminder.reminder_id],
            done
          );
        }
      );
    }
  );
});
