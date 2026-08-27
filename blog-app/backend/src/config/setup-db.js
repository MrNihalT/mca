const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function setupDatabase() {
    console.log("Connecting to MySQL server...");
    
    // Connect to MySQL without specifying database first, in case it doesn't exist
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "9292"
    });

    console.log("Creating database if it doesn't exist...");
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "blog_app"}\``);
    await connection.end();

    // Reconnect with pool/connection to the specific database
    const pool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "blog_app"
    });

    console.log("Creating tables...");

    // 1. Users Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('USER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'USER',
            avatar VARCHAR(255) DEFAULT NULL,
            bio TEXT DEFAULT NULL,
            github VARCHAR(150) DEFAULT NULL,
            twitter VARCHAR(150) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    console.log(" - 'users' table created or already exists");

    // Auto-alter users table to add profile columns if it was already created without them
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'avatar'");
        if (columns.length === 0) {
            console.log("Altering 'users' table to add profile columns (avatar, bio, github, twitter)...");
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN avatar VARCHAR(255) DEFAULT NULL,
                ADD COLUMN bio TEXT DEFAULT NULL,
                ADD COLUMN github VARCHAR(150) DEFAULT NULL,
                ADD COLUMN twitter VARCHAR(150) DEFAULT NULL
            `);
            console.log(" - 'users' table altered successfully");
        }
    } catch (alterErr) {
        console.error("Failed to alter users table:", alterErr);
    }

    // 2. Posts Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            content TEXT NOT NULL,
            image VARCHAR(255),
            author_id INT NOT NULL,
            category VARCHAR(50) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log(" - 'posts' table created or already exists");

    // Auto-alter posts table to add category column if it was already created without it
    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM posts LIKE 'category'");
        if (columns.length === 0) {
            console.log("Altering 'posts' table to add 'category' column...");
            await pool.query("ALTER TABLE posts ADD COLUMN category VARCHAR(50) DEFAULT NULL");
            console.log(" - 'posts' table altered successfully");
        }
    } catch (alterErr) {
        console.error("Failed to alter posts table:", alterErr);
    }

    // 3. Comments Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content TEXT NOT NULL,
            user_id INT NOT NULL,
            post_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    `);
    console.log(" - 'comments' table created or already exists");

    // 4. Post Likes Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS post_likes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            post_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_post_like (user_id, post_id),
            INDEX idx_post_likes_post_id (post_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    `);
    console.log(" - 'post_likes' table created or already exists");

    // 5. Saved Posts Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS saved_posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            post_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_post_save (user_id, post_id),
            INDEX idx_saved_posts_post_id (post_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    `);
    console.log(" - 'saved_posts' table created or already exists");

    // 6. Seed Admin user if none exists
    const [rows] = await pool.query("SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (rows.length === 0) {
        console.log("Seeding admin user...");
        const adminEmail = "admin@blog.com";
        const adminPassword = "adminpassword";
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ["System Admin", adminEmail, hashedPassword, "ADMIN"]
        );
        console.log(`\n>>> ADMIN USER SEEDED SUCCESSFULY!`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}\n`);
    } else {
        console.log("Admin user already exists. Skipping seeding.");
    }

    console.log("Database setup complete!");
    await pool.end();
}

setupDatabase().catch(err => {
    console.error("Database setup failed:", err);
    process.exit(1);
});
