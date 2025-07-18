const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  router.get("/stats", async (req, res) => {
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

  return router;
};
