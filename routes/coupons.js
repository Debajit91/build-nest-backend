const express = require("express");
const { ObjectId } = require("mongodb");

const createCouponRouter = (db) => {
  const app = express.Router();

  // GET all coupons
  app.get("/", async (req, res) => {
    try {
      const coupons = await db.collection("coupons").find().toArray();
      res.send(coupons);
    } catch (err) {
      res.status(500).send({ error: "Failed to fetch coupons" });
    }
  });

  // POST a new coupon
  app.post("/", async (req, res) => {
    try {
      const { code, discount, description } = req.body;
      const result = await db.collection("coupons").insertOne({
        code,
        discount: parseFloat(discount),
        description,
        createdAt: new Date(),
      });
      res.send(result);
    } catch (err) {
      res.status(500).send({ error: "Failed to add coupon" });
    }
  });

  app.put("/:id", async (req, res) => {
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
