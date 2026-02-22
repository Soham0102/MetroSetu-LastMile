const express = require("express");
const router = express.Router();
const {
  signup, login, concessionSignup, adminLogin,
  getConcessionApplicants, approveConcession, rejectConcession, serveConcessionDocument,
  driverSignup, getDriverApplicants, approveDriver, rejectDriver, serveDriverDocument,
  getAdminHistory, getSOSAlerts,
} = require("../controllers/authController");
const { concessionUpload, driverUpload } = require("../middleware/uploadMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/signup/concession", concessionUpload, concessionSignup);
router.post("/signup/driver", driverUpload, driverSignup);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/concession/applicants", protect, adminOnly, getConcessionApplicants);
router.patch("/concession/:userId/approve", protect, adminOnly, approveConcession);
router.patch("/concession/:userId/reject", protect, adminOnly, rejectConcession);
router.get("/concession/document/:userId/:docType", serveConcessionDocument);
router.get("/driver/applicants", protect, adminOnly, getDriverApplicants);
router.patch("/driver/:userId/approve", protect, adminOnly, approveDriver);
router.patch("/driver/:userId/reject", protect, adminOnly, rejectDriver);
router.get("/driver/document/:userId/:docType", serveDriverDocument);
router.get("/admin/history", protect, adminOnly, getAdminHistory);
router.get("/admin/sos-alerts", protect, adminOnly, getSOSAlerts);

module.exports = router;
