const admin = require("../Firebase/firebase");

const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(403).send({ error: "Unauthorized" });
    }

    try {
      const userDoc = await admin.firestore().collection("users").doc(userEmail).get();
      const userRole = userDoc.data()?.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).send({ error: "Access denied: Insufficient role" });
      }

      next(); // user has correct role
    } catch (err) {
      console.error("Role check failed", err);
      res.status(500).send({ error: "Server error during role check" });
    }
  };
};

module.exports = requireRole;