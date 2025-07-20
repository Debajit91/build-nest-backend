const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).send("Unauthorized");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;

    // Fetch role from Firestore
    const userDoc = await getFirestore()
      .collection("users")
      .doc(decoded.uid)
      .get();
    const userData = userDoc.data();

    if (!userData?.role) return res.status(403).send("Role not found");

    req.user.role = userData.role;
    next();
  } catch (err) {
    res.status(403).send("Invalid token");
  }
};

module.exports = verifyToken
