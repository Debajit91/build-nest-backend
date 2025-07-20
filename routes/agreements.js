const express = require("express");
const { ObjectId } = require("mongodb");


const createAgreementRouter = (db) => {
  const app = express.Router();

  app.use((req, res, next) => {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://buildnest-d8c3f.web.app"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next(); // continue to next route
  });

  app.get("/", async (req, res) => {
    try {
      const agreements = await db.collection("agreements").find().toArray();
      res.send(agreements);
    } catch (err) {
      res.status(500).send({ error: "Failed to fetch agreements" });
    }
  });

  app.get("/requests", async (req, res) => {
    try {
      const requests = await db
        .collection("agreements")
        .find({ status: "pending" })
        .toArray();
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error("Error fetching requests:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch requests" });
    }
  });

  // get agreement by email
  app.get("/:email", async (req, res) => {
    const { email } = req.params;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    try {
      const agreement = await db.collection("agreements").findOne({ email });
      const user = await db.collection("users").findOne({ email });
      if (!agreement) {
        return res
          .status(404)
          .json({ success: false, message: "No agreement found" });
      }

      res.json({
        success: true,
        agreement: {
          ...agreement,
          userId: user?._id?.toString() || null,
        },
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to get agreement" });
    }
  });

  // create a new agreement request
  app.post("/", async (req, res) => {
    try {
      const agreement = req.body;

      const user = await db
        .collection("users")
        .findOne({ email: agreement.email });

      const existingAgreement = await db.collection("agreements").findOne({
        email: agreement.email,
        $or: [
          { status: "pending" },
          {
            status: "checked",
            acceptedAt: { $exists: true },
          },
        ],
      });

      if (existingAgreement) {
        return res.send({
          alreadyExists: true,
          message: "You already applied for an apartment.",
        });
      }

      const apartmentTaken = await db.collection("agreements").findOne({
        apartmentNo: agreement.apartmentNo,
        status: "checked",
        acceptedAt: { $exists: true },
      });

      if (apartmentTaken) {
        return res.send({
          apartmentTaken: true,
          message: "This apartment is already taken.",
        });
      }

      // Insert new agreement with "pending" status
      const result = await db.collection("agreements").insertOne({
        ...agreement,
        status: "pending",
        createdAt: new Date(),
      });

      // add hasAgreement flag
      await db.collection("apartments").updateOne(
        {
          apartmentNo: agreement.apartmentNo,
        },
        {
          $set: { hasAgreement: true },
        }
      );

      res.send({ insertedId: result.insertedId });
    } catch (error) {
      console.error("Error creating agreement:", error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

  // PATCH /agreements/:id
  app.patch("/agreements/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const result = await db
        .collection("agreements")
        .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

      res.send({ modifiedCount: result.modifiedCount });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Failed to update status" });
    }
  });

  // PATCH /agreements/:id/decision
  app.patch("/requests/:id/decision", async (req, res) => {
    const { id } = req.params;
    const { action, userEmail } = req.body;
    const agreement = await db
      .collection("agreements")
      .findOne({ _id: new ObjectId(id) });

    if (!["accept", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action type" });
    }

    try {
      const filter = { _id: new ObjectId(id) };

      const update = {
        $set: {
          status: "checked",
        },
      };

      if (action === "accept") {
        update.$set.acceptedAt = new Date();

        await db
          .collection("users")
          .updateOne({ email: userEmail }, { $set: { role: "member" } });
      }

      if (action === "reject") {
        update.$set.rejectedAt = new Date();

        if (agreement?.apartmentNo) {
          await db
            .collection("apartments")
            .updateOne(
              { apartmentNo: agreement.apartmentNo },
              { $set: { hasAgreement: false } }
            );
        }
      }

      await db.collection("agreements").updateOne(filter, update);

      res.json({ success: true, message: "Agreement updated" });
    } catch (error) {
      console.error("Error updating agreement:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  return app;
};
module.exports = createAgreementRouter;
