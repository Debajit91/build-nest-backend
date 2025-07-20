const express = require("express");
const Stripe = require("stripe");
const { ObjectId } = require("mongodb");
const verifyToken = require("../Middleware/verifyToken");



const createPaymentsRouter = (db) => {
  const app = express.Router();

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://buildnest-d8c3f.web.app");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next(); // continue to next route
  });
  
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const router = express.Router();

  // 🔹 Create Payment Intent
  router.post("/create-payment-intent",  async (req, res) => {
    const { amount } = req.body;

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // Use directly if frontend sends cents
        currency: "usd",
      });

      res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error("❌ Stripe error:", err);
      res.status(500).send({ error: "Payment intent failed" });
    }
  });

  // 🔸 Save Payment Info After Success
  router.post("/",  async (req, res) => {
    const {
      userId,
      transactionId,
      date,
      originalRent,
      discountedRent,
      coupon,
      discount,
      month,
      apartment,
    } = req.body;

    if (!userId || !transactionId || !month || !apartment || !discountedRent) {
      return res.status(400).send({ error: "Missing required fields" });
    }

    try {
      // 🔍 Optional: Verify with Stripe
      const intent = await stripe.paymentIntents.retrieve(transactionId);
      if (!intent || intent.status !== "succeeded") {
        return res.status(400).send({ error: "Invalid or incomplete payment" });
      }

      const payment = {
        userId: new ObjectId(userId),
        name: apartment.name,
        email: apartment.email,
        floor: apartment.floor,
        block: apartment.block,
        room: apartment.apartmentNo,
        originalRent,
        discountedRent,
        coupon,
        discount: discount || 0,
        amount: discountedRent,
        transactionId,
        month,
        paidAt: new Date(date || Date.now()).toISOString(),
      };

      const result = await db.collection("payments").insertOne(payment);
      res.status(201).send({ success: true, insertedId: result.insertedId });
    } catch (err) {
      console.error("❌ Payment save error:", err);
      res.status(500).send({ success: false, error: err.message });
    }
  });


  router.get("/my-payments/:email",  async (req, res) => {
  const { email } = req.params;
  try {
    const payments = await db
      .collection("payments")
      .find({ email })
      .sort({ paidAt: -1 })
      .toArray();
    res.send({ success: true, payments });
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});


  return router;
};

module.exports = createPaymentsRouter;
