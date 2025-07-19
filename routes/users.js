const express = require("express");
const { ObjectId } = require("mongodb");

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

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format", role: null });
    }

    try {
      const user = await db.collection("users").findOne({ email });
      if (!user) return res.status(404).json({ success: false, role: null });

      res.json({ success: true, role: user.role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ role: null });
    }
  });

  app.get("/members", async (req, res) => {
    try {
      const members = await db
        .collection("users")
        .find({ role: "member" })
        .toArray();
      res.json({ success: true, data: members });
    } catch (error) {
      console.error("Error fetching members:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch members" });
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

  app.patch("/remove-member/:id", async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    if(!email ){
      return res.status(400).json({
        success: false, 
        message: "Email Required"
      });
    }

    try {
      const result = await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(id), email },
          { $set: { role: "user" } }
        );

        

      if (result.modifiedCount === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: "User not found or already not a member",
          });
      }

      const agreements = await db.collection("agreements")
      .find({email})
      .toArray();

      if (agreements.length > 0) {
      for (const agreement of agreements) {
        if (agreement.apartmentNo) {
          await db
            .collection("apartments")
            .updateOne(
              { apartmentNo: agreement.apartmentNo },
              { $set: { hasAgreement: false } }
            );
          }
        }
        await db.collection("agreements").deleteMany({email});
      }

      res.json({ success: true, message: "Member removed successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500)
        .json({ success: false, message: "Failed to remove member" });
    }
  });

  return app;
}

module.exports = createUserRouter;
