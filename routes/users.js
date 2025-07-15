const express = require("express");
const app = express.Router();
const { getDB } = require("../db/connect");

// GET all users
app.get("/", async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find().toArray();
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: "Error fetching users" });
  }
});

module.exports = app;
