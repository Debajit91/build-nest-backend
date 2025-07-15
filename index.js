const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const createCouponRouter = require("./routes/coupons");

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

const uri = process.env.DB_URI;
const client = new MongoClient(uri);

async function start() {
  try {
    await client.connect();
    const db = client.db("buildNest");

  
    app.use("/coupons", createCouponRouter(db));

    app.listen(5000, () => {
      console.log("Server running at http://localhost:5000");
    });
  } catch (err) {
    console.error("MongoDB connection failed", err);
  }
}

start();
