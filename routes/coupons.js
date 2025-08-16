const express = require("express");
const { ObjectId } = require("mongodb");
// const verifyToken = require("../Middleware/verifyToken");


const createCouponRouter = (db) => {
  const app = express.Router();

  // app.use((req, res, next) => {
  //   res.setHeader("Access-Control-Allow-Origin", "https://buildnest-d8c3f.web.app");
  //   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  //   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  //   // Handle preflight requests
  //   if (req.method === "OPTIONS") {
  //     return res.sendStatus(200);
  //   }

  //   next(); // continue to next route
  // });

  // GET all coupons
  app.get("/",    async (req, res) => {
    try {
      const coupons = await db.collection("coupons").find().toArray();
      res.send(coupons);
    } catch (err) {
      res.status(500).send({ error: "Failed to fetch coupons" });
    }
  });

  // POST a new coupon
  app.post("/",  async (req, res) => {
    try {
      const { code, discount, description, expiresAt } = req.body;
      const result = await db.collection("coupons").insertOne({
        code,
        discount: parseFloat(discount),
        description,
        createdAt: new Date(),
        ...(expiresAt && {expiresAt: new Date(expiresAt)})
      });
      res.send(result);
    } catch (err) {
      res.status(500).send({ error: "Failed to add coupon" });
    }
  });

  app.post("/validate-coupon",  async (req, res) => {
    const { code } = req.body;
    const coupon = await db.collection("coupons").findOne({ code });

    if (!coupon || coupon.expiresAt < new Date()) {
      return res.json({ valid: false });
    }

    return res.json({ valid: true, discount: coupon.discount }); // e.g., 10
  });

  app.put("/:id",  async (req, res) => {
    const id = req.params.id;
    const { code, discount, description } = req.body;
    const result = await db.collection("coupons").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          code,
          discount: parseFloat(discount),
          description,
        },
      }
    );
    res.send(result);
  });

  app.delete("/:id", async (req, res) => {
    const id = req.params.id;
    const result = await db
      .collection("coupons")
      .deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  });

  return app;
};

module.exports = createCouponRouter;
