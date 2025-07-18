const express = require("express");

function createUserRouter(db) {
  const app = express.Router();

  // GET all users
  app.get("/", async (req, res) => {
    try {
      const users = await db.collection("users").find().toArray();
      res.send(users);
    } catch (err) {
      res.status(500).send({ message: "Error fetching users" });
    }
  });

  // GET role by email
  app.get("/role/:email", async (req, res) => {
    const { email } = req.params;

    if (!email || typeof email !== 'string' || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "Invalid email format", role: null });
  }

    try {
      const user = await db.collection("users").findOne({ email });
      if (!user) return res.status(404).json({success: false, role: null });

      res.json({success: true, role: user.role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ role: null });
    }
  });

  // POST user — Create only if not exists
  app.post("/", async (req, res) => {
    const user = req.body;

    if (!user || !user.email) {
      return res.status(400).json({ message: "Invalid user data" });
    }

    try {
      const usersCollection = db.collection("users");

      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: user.email });

      if (existingUser) {
        return res.status(200).json({ message: "User already exists" });
      }

      // Assign role and createdAt timestamp
      const newUser = {
        ...user,
        role: "user", // default role
        createdAt: new Date(), // timestamp
      };

      const result = await usersCollection.insertOne(newUser);

      res.status(201).json({ success: true, insertedId: result.insertedId });
    } catch (error) {
      console.error("Error saving user:", error);
      res.status(500).json({ message: "Failed to save user" });
    }
  });

  return app;
}

module.exports = createUserRouter;
