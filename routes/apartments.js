const verifyToken = require("../Middleware/verifyToken");

const createApartmentRouter = (db) => {
  const app = require("express").Router();

  app.get("/",   async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const minRent = parseInt(req.query.minRent) || 0;
    const maxRent = parseInt(req.query.maxRent) || Infinity;
    const email = req.query.email;

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

      // All accepted agreements (someone already took that apartment)
      const acceptedAgreements = await db
        .collection("agreements")
        .find({ status: "checked", acceptedAt: { $exists: true } })
        .toArray();

      const takenApartmentNos = acceptedAgreements.map((a) => a.apartmentNo);

      // Current user's agreements
      let userAgreements = [];
      if (email) {
        userAgreements = await db
          .collection("agreements")
          .find({ email })
          .sort({ _id: -1 })
          .toArray();
      }

      const updatedApartments = apartments.map((apt) => {
        const aptNo = apt.apartmentNo;

        const userAgreement = userAgreements.find(
          (ag) =>
            ag.apartmentNo === aptNo &&
            ag.block === apt.block &&
            ag.floor === apt.floor
        );

        const someoneTookIt = takenApartmentNos.includes(aptNo);

        let statusLabel = "Ready for Agreement";
        let hasAgreement = false;

        if (userAgreement) {
          if (userAgreement.status === "pending") {
            statusLabel = "Agreement Pending Yet";
            hasAgreement = true;
          } else if (
            userAgreement.status === "checked" &&
            userAgreement.acceptedAt
          ) {
            statusLabel = "Agreement Done";
            hasAgreement = true;
          } else if (
            userAgreement.status === "checked" &&
            userAgreement.rejectedAt
          ) {
            statusLabel = "Ready for Agreement";
            hasAgreement = false;
          }
        } else if (someoneTookIt) {
          statusLabel = "Agreement Done";
          hasAgreement = true;
        }

        return {
          ...apt,
          statusLabel,
          hasAgreement,
        };
      });

      res.send({
        apartments: updatedApartments,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error" });
    }
  });

  return app;
};

module.exports = createApartmentRouter;
