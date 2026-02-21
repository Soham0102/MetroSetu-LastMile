const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const uploadDir = path.join(__dirname, "../uploads/concession");
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|jpg|jpeg|png)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error("Only PDF and images allowed"));
  },
});

exports.concessionUpload = upload.fields([
  { name: "studentId", maxCount: 1 },
  { name: "corporateId", maxCount: 1 },
  { name: "aadhaarCard", maxCount: 1 },
  { name: "rationCard", maxCount: 1 },
]);
