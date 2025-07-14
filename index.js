const express = require("express");
const cors = require("cors");
const { connectToDatabase } = require("./db/connect");

require("dotenv").config();

const userRoutes = require('./routes/users');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

// Your routes
app.get("/", (req, res) => {
  res.send("Build Nest Server is Running");
});

// Connect to DB, then start server
const port = process.env.PORT || 5000;
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
});
