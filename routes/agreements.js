const express = require("express");
const app = express.Router();

const createAgreementRouter = (db) => {
  const app = express.Router();

  // GET all coupons
  app.get("/", async (req, res) => {
    try {
      const agreements = await db.collection("agreements").find().toArray();
      res.send(agreements);
    } catch (err) {
      res.status(500).send({ error: "Failed to fetch agreements" });
    }
  });

// POST /agreements - create a new agreement request
app.post("/", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const agreement = req.body;

    // Check if the user already applied for this apartment
    const existingAgreement = await db.collection("agreements").findOne({
      email: agreement.email,
    });

    if (existingAgreement) {
      return res.send({ alreadyExists: true, message: "You already applied for an apartment." });
    }

    const apartmentTaken = await db.collection("agreements").findOne({
      apartmentNo: agreement.apartmentNo,
    });

    if (apartmentTaken) {
      return res.send({ apartmentTaken: true, message: "This apartment is already taken." });
    }

    // Insert new agreement with "pending" status
    const result = await db.collection("agreements").insertOne({
      ...agreement,
      status: "pending", 
      createdAt: new Date(),
    });

    await db.collection('apartments').updateOne(
        {
            apartmentNo: agreement.apartmentNo},
        {
            $set:{hasAgreement: true}
        }
        
    );

    res.send({ insertedId: result.insertedId });
  } catch (error) {
    console.error("Error creating agreement:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});
return app;
}
module.exports = createAgreementRouter;
