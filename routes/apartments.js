const createApartmentRouter = (db) =>{
    const app = require("express").Router()
    app.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const minRent = parseInt(req.query.minRent) || 0;
  const maxRent = parseInt(req.query.maxRent) || Infinity;

  const skip = (page - 1) * limit;

  const query = {
    rent: { $gte: minRent, $lte: maxRent },
  };

  try {
    const apartments = await db
      .collection("apartments")
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("apartments").countDocuments(query);

    res.send({
      apartments,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
  });

  return app;
}





module.exports = createApartmentRouter;