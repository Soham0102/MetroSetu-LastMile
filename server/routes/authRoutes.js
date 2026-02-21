const express = require("express");
const router = express.Router();
const { signup, login, concessionSignup, adminLogin, getConcessionApplicants, approveConcession, rejectConcession, serveConcessionDocument } = require("../controllers/authController");
const { concessionUpload } = require("../middleware/uploadMiddleware");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/signup/concession", concessionUpload, concessionSignup);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.get("/concession/applicants", protect, adminOnly, getConcessionApplicants);
router.patch("/concession/:userId/approve", protect, adminOnly, approveConcession);
router.patch("/concession/:userId/reject", protect, adminOnly, rejectConcession);
router.get("/concession/document/:userId/:docType", serveConcessionDocument);

module.exports = router;
