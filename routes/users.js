const express = require("express");
const router = express.Router();
const { getDB } = require("../db/connect");

// GET all users
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find().toArray();
    res.send(users);
  } catch (err) {
    res.status(500).send({ message: "Error fetching users" });
  }
});

module.exports = router;
