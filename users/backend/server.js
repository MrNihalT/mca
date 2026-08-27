const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "9292",
    database: "sjcd",
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed");
        console.log(err);
        return;
    }

    console.log("Connected to MySQL");
});

// Insert user

app.post("/register", (req, res) => {
    const { username, password } = req.body;

    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";

    db.query(sql, [username, password], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error inserting data");
        } else {
            res.send("Login details saved successfully");
        }
    });
});

// Delete user
app.delete("/users/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM users WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error deleting user");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("User not found");
        }

        res.send("User deleted successfully");
    });
});

// Get all users
app.get("/users", (req, res) => {
    const sql = "SELECT * FROM users";

    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Error getting users");
        } else {
            res.json(result);
        }
    });
});

// Update user
app.put("/users/:id", (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    const sql = `
        UPDATE users
        SET username = ?, password = ?
        WHERE id = ?
    `;

    db.query(sql, [username, password, id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error updating user");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("User not found");
        }

        res.send("User updated successfully");
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
