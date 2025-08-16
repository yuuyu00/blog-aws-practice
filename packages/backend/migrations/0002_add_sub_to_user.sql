-- Add sub column to User table for Supabase Auth user ID
-- This migration needs to handle foreign key constraints properly
-- Note: D1 doesn't support BEGIN TRANSACTION, so operations are atomic by default

PRAGMA foreign_keys=off;

-- 1. Save existing data from all tables
CREATE TABLE User_temp AS SELECT * FROM User;
CREATE TABLE Article_temp AS SELECT * FROM Article;
CREATE TABLE Category_temp AS SELECT * FROM Category;
CREATE TABLE _ArticleToCategory_temp AS SELECT * FROM _ArticleToCategory;

-- 2. Drop all tables in correct order (junction table first)
DROP TABLE _ArticleToCategory;
DROP TABLE Article;
DROP TABLE Category;
DROP TABLE User;

-- 3. Recreate User table with sub column
CREATE TABLE User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sub TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL
);

-- 4. Recreate Article table
CREATE TABLE Article (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  userId INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- 5. Recreate Category table
CREATE TABLE Category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

-- 6. Recreate junction table for many-to-many relationship
CREATE TABLE _ArticleToCategory (
  A INTEGER NOT NULL,
  B INTEGER NOT NULL,
  FOREIGN KEY (A) REFERENCES Article(id) ON DELETE CASCADE,
  FOREIGN KEY (B) REFERENCES Category(id) ON DELETE CASCADE
);

-- 7. Restore data
-- For User, generate temporary sub values
INSERT INTO User (id, sub, email, name)
SELECT id, 'temp_sub_' || id || '_' || LOWER(HEX(RANDOMBLOB(8))), email, name FROM User_temp;

-- Restore Article data
INSERT INTO Article (id, title, content, userId)
SELECT id, title, content, userId FROM Article_temp;

-- Restore Category data
INSERT INTO Category (id, name)
SELECT id, name FROM Category_temp;

-- Restore many-to-many relationships
INSERT INTO _ArticleToCategory (A, B)
SELECT A, B FROM _ArticleToCategory_temp;

-- 8. Create indexes
CREATE UNIQUE INDEX User_sub_key ON User(sub);
CREATE UNIQUE INDEX User_email_key ON User(email);
CREATE UNIQUE INDEX _ArticleToCategory_AB_unique ON _ArticleToCategory(A, B);
CREATE INDEX _ArticleToCategory_B_index ON _ArticleToCategory(B);

-- 9. Drop temporary tables
DROP TABLE User_temp;
DROP TABLE Article_temp;
DROP TABLE Category_temp;
DROP TABLE _ArticleToCategory_temp;

PRAGMA foreign_keys=on;