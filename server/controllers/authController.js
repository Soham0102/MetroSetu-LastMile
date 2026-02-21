const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ================= SIGNUP =================
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, gender } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      gender: gender || null
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= CONCESSION SIGNUP =================
exports.concessionSignup = async (req, res) => {
  try {
    const { name, email, phone, password, gender, concessionCategory } = req.body;
    const files = req.files || {};

    if (!name || !email || !phone || !password || !gender || !concessionCategory) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const validCategories = ["Student", "Corporate", "Less Privileged"];
    if (!validCategories.includes(concessionCategory)) {
      return res.status(400).json({ message: "Invalid concession category" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const concessionDocuments = {};
    if (concessionCategory === "Student") {
      if (!files.studentId || !files.studentId[0]) {
        return res.status(400).json({ message: "Student ID document is required" });
      }
      concessionDocuments.studentId = files.studentId[0].path;
    } else if (concessionCategory === "Corporate") {
      if (!files.corporateId || !files.corporateId[0]) {
        return res.status(400).json({ message: "Corporate ID document is required" });
      }
      concessionDocuments.corporateId = files.corporateId[0].path;
    } else if (concessionCategory === "Less Privileged") {
      if (!files.aadhaarCard || !files.aadhaarCard[0]) {
        return res.status(400).json({ message: "Aadhaar Card is required" });
      }
      if (!files.rationCard || !files.rationCard[0]) {
        return res.status(400).json({ message: "Ration Card is required" });
      }
      concessionDocuments.aadhaarCard = files.aadhaarCard[0].path;
      concessionDocuments.rationCard = files.rationCard[0].path;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      gender,
      concessionCategory,
      concessionDocuments,
    });

    res.status(201).json({
      message: "Concession application submitted successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        concessionCategory: newUser.concessionCategory,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        concessionApproved: !!user.concessionApproved
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= ADMIN LOGIN (fixed credentials) =================
const ADMIN_USERNAME = "Arjuna";
const ADMIN_PASSWORD = "We_win";

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(400).json({ message: "Invalid admin credentials" });
    }
    const token = jwt.sign(
      { id: "admin", isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      token,
      user: { id: "admin", name: "Admin", isAdmin: true }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= CONCESSION APPLICANTS (admin) =================
exports.getConcessionApplicants = async (req, res) => {
  try {
    const applicants = await User.find({
      concessionCategory: { $exists: true, $ne: null },
      concessionApproved: { $ne: true },
      concessionRejected: { $ne: true }
    })
      .select("name email phone concessionCategory concessionDocuments createdAt")
      .lean();
    res.json(applicants);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= APPROVE / REJECT CONCESSION =================
exports.approveConcession = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { concessionApproved: true, concessionRejected: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    const io = req.app.get("io");
    if (io) io.to(`user:${user._id}`).emit("concession:approved", { message: "You are now a Concession User." });
    res.json({ message: "Concession approved", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.rejectConcession = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { concessionRejected: true, concessionApproved: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Concession rejected", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Serve concession document (admin only; token in query or header for link-in-new-tab)
exports.serveConcessionDocument = async (req, res) => {
  try {
    const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) return res.status(401).json({ message: "Not authorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ message: "Admin required" });

    const path = require("path");
    const fs = require("fs");
    const { userId, docType } = req.params;
    const validTypes = ["studentId", "corporateId", "aadhaarCard", "rationCard"];
    if (!validTypes.includes(docType)) return res.status(400).json({ message: "Invalid doc type" });
    const user = await User.findById(userId).select("concessionDocuments").lean();
    if (!user || !user.concessionDocuments || !user.concessionDocuments[docType]) {
      return res.status(404).json({ message: "Document not found" });
    }
    const stored = user.concessionDocuments[docType];
    const filePath = path.isAbsolute(stored) ? stored : path.join(__dirname, "..", stored);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
