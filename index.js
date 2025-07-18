const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const createCouponRouter = require("./routes/coupons");
const createUserRouter = require("./routes/users");
const createApartmentRouter = require("./routes/apartments");
const createAgreementRouter = require("./routes/agreements");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

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
    app.locals.db = db;

    // routes
    app.use("/coupons", createCouponRouter(db));

    
    app.use("/users", createUserRouter(db));

    app.use('/apartments', createApartmentRouter(db));

    app.use('/agreements', createAgreementRouter(db));

    app.use("/api", require("./routes/payments"));


    app.listen(5000, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed", err);
  }
}

start();
