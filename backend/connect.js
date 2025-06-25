const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.resolve(__dirname, "fridge.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error("Can't open database, ", err.message);
  }
  console.log("Connected to the fridge.db database");
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
          user_id INTEGER PRIMARY KEY,
          health_goal TEXT NOT NULL,
          dietary_preferences TEXT NOT NULL,
          age INTEGER NOT NULL,
          weight_kg REAL NOT NULL,
          height_mtrs REAL NOT NULL,
          gender TEXT NOT NULL,
          activity TEXT NOT NULL,
          calorie_goal INTEGER NOT NULL,
          protein_goal INTEGER NOT NULL,
          carb_goal INTEGER NOT NULL,
          fat_goal INTEGER NOT NULL
          )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS users_auth (
          user_id INTEGER PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(user_id)
          )`
  );

  db.run(`CREATE TABLE IF NOT EXISTS food_items (
          item_id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          calories INTEGER NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fats REAL NOT NULL,
          sugars REAL NOT NULL
          )`);

  db.run(`CREATE TABLE IF NOT EXISTS consumption_logs (
          log_id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          food_id INTEGER NOT NULL,
          servings REAL NOT NULL,
          date_logged TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (user_id),
          FOREIGN KEY (food_id) REFERENCES food_items (item_id)
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS grocery_items (
          item_id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          added_date TEXT NOT NULL,
          expiration_date TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (user_id)
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS reminders (
        reminder_id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        food_name TEXT NOT NULL,
        reminder_date TEXT NOT NULL,
        reminder_type TEXT NOT NULL,
        notified TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (user_id)
    )`);
});

export default db;
