const express = require("express");
const verifyToken = require("../Middleware/verifyToken");
const requireRole = require("../Middleware/requireRole");

module.exports = (db) => {
  const router = express.Router();

  router.get("/stats",   async (req, res) => {
    try {
      const totalRooms = await db.collection("apartments").countDocuments();
      const availableRooms = await db
        .collection("apartments")
        .countDocuments({ hasAgreement: { $ne: true } });

      const unavailableRooms = totalRooms - availableRooms;

      const totalUsers = await db.collection("users").countDocuments();
      const totalMembers = await db
        .collection("users")
        .countDocuments({ role: "member" });

      res.send({
        totalRooms,
        availableRoomsPercentage: totalRooms
          ? ((availableRooms / totalRooms) * 100).toFixed(2)
          : 0,
        unavailableRoomsPercentage: totalRooms
          ? ((unavailableRooms / totalRooms) * 100).toFixed(2)
          : 0,
        totalUsers,
        totalMembers,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Failed to fetch admin stats" });
    }
  });

  
  router.post("/announcements",   async (req, res) => {
    const db = req.app.locals.db;
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).send({ error: "Title and description required" });
    }

    try {
      const result = await db.collection("announcements").insertOne({
        title,
        description,
        createdAt: new Date(),
      });
      res.send({ insertedId: result.insertedId });
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Failed to create announcement" });
    }
  });

  return router;
};
