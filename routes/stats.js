// server/routes/stats.js (example Express router)
const router = require("express").Router();

router.get("/overview", async (req, res) => {
  try {
    // Fetch minimal data for counts (prefer COUNT queries or projections)
    const [apartments, members, bookings, announcements, payments] = await Promise.all([
      db.collection("apartments").find({}, { projection: { occupied: 1, status: 1 }}).toArray(),
      db.collection("users").find({}, { projection: { _id: 1 }}).toArray(),
      db.collection("bookings").find({}, { projection: { status: 1 }}).toArray(),
      db.collection("announcements").find({}, { projection: { _id: 1 }}).toArray(),
      db.collection("payments").find({}, { projection: { amount: 1, paidAt: 1 }}).toArray(),
    ]);

    const totalApartments = apartments.length;
    const occupied = apartments.filter(a => a.occupied || a.status === "occupied").length;
    const vacant = Math.max(totalApartments - occupied, 0);
    const activeResidents = members.length;
    const pendingBookings = bookings.filter(b => (b.status || "").toLowerCase() === "pending").length;
    const totalAnnouncements = announcements.length;

    // Example: group payments by month (client can also group)
    const byMonthMap = new Map();
    for (const p of payments) {
      const d = new Date(p.paidAt || p.createdAt || Date.now());
      const key = d.toLocaleString("en-US", { month: "short" });
      byMonthMap.set(key, (byMonthMap.get(key) || 0) + Number(p.amount || 0));
    }
    const revenueByMonth = Array.from(byMonthMap, ([month, rent]) => ({ month, rent }));

    res.json({
      counters: { totalApartments, activeResidents, pendingBookings, totalAnnouncements },
      occupancy: { occupied, vacant },
      revenueByMonth,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compute overview" });
  }
});

module.exports = router;
