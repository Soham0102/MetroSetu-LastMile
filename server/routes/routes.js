const express = require("express");
const router = express.Router();
const { getTransitRoute } = require("../controllers/routesController");

router.post("/transit", getTransitRoute);

module.exports = router;
