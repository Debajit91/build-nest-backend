const express = require("express");

function createApartmentRouter(db) {
  const app = express.Router();

  // GET all users
  app.get("/", async (req, res) => {
    try {
      const users = await db.collection("apartments").find().toArray();
      res.send(apartments);
    } catch (err) {
      res.status(500).send({ message: "Error fetching apartments" });
    }
  });

  return app;
}

module.exports = createApartmentRouter;