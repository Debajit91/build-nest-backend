const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
const createCouponRouter = require("./routes/coupons");
const createUserRouter = require("./routes/users");
const createApartmentRouter = require("./routes/apartments");
const createAgreementRouter = require("./routes/agreements");
const createAdminRouter = require("./routes/admin");
const createAnnouncementRouter = require("./routes/announcements");
const createPaymentsRouter = require("./routes/payments");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;



const allowedOrigins = [
  "http://localhost:5173",
  "https://buildnest-d8c3f.web.app"
];

app.use(
  cors({
    origin: allowedOrigins
  })
);

app.use(express.json());

const uri = process.env.DB_URI;
const client = new MongoClient(uri);

async function start() {
  try {
    // await client.connect();
    const db = client.db("buildNest");
    app.locals.db = db;

    // routes
    app.use("/coupons", createCouponRouter(db));

    app.use("/users", createUserRouter(db));

    app.use("/apartments", createApartmentRouter(db));

    app.use("/agreements", createAgreementRouter(db));

    app.use("/admin", createAdminRouter(db));
    app.use("/announcements", createAnnouncementRouter(db));

    app.use("/payments", createPaymentsRouter(db));

    app.use("/stats", require("./routes/stats"));

    app.listen(port, () => {
      // console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed", err);
  }
}

start();
