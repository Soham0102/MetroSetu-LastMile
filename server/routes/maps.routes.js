const express = require("express");
const router = express.Router();
const { getDistanceMatrix } = require("../controllers/maps.controller");

router.get("/distance-matrix", getDistanceMatrix);

module.exports = router;
