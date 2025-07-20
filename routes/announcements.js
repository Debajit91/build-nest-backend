const express = require("express");
const verifyToken = require("../Middleware/verifyToken");
const app = express.Router();

app.get("/", async (req, res) => {
  const db = req.app.locals.db;

  // app.use((req, res, next) => {
  //   res.setHeader(
  //     "Access-Control-Allow-Origin",
  //     "https://buildnest-d8c3f.web.app"
  //   );
  //   res.setHeader(
  //     "Access-Control-Allow-Methods",
  //     "GET, POST, PUT, DELETE, OPTIONS"
  //   );
  //   res.setHeader(
  //     "Access-Control-Allow-Headers",
  //     "Content-Type, Authorization"
  //   );

  //   // Handle preflight requests
  //   if (req.method === "OPTIONS") {
  //     return res.sendStatus(200);
  //   }

  //   next(); // continue to next route
  // });
  try {
    const announcements = await db
      .collection("announcements")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    res.send({ announcements });
  } catch (err) {
    console.error("Failed to fetch announcements", err);
    res.status(500).send({ error: "Failed to fetch announcements" });
  }
});

module.exports = (db) => app;
