const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const uploadDir = path.join(__dirname, "../uploads/concession");
const driverUploadDir = path.join(__dirname, "../uploads/driver");
try {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(driverUploadDir, { recursive: true });
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

const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, driverUploadDir),
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

const driverUpload = multer({
  storage: driverStorage,
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

exports.driverUpload = driverUpload.fields([
  { name: "rc", maxCount: 1 },
  { name: "insurance", maxCount: 1 },
]);
