const express = require("express");
const app = express.Router();

app.get("/", async (req, res) => {
  const db = req.app.locals.db;
  try {
    const announcements = await db.collection("announcements").find().sort({ createdAt: -1 }).toArray();
    res.send({ announcements });
  } catch (err) {
    console.error("Failed to fetch announcements", err);
    res.status(500).send({ error: "Failed to fetch announcements" });
  }
});

module.exports = (db) => app;
