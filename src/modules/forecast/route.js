const express = require("express");
const { getForecast } = require("./controller");

const router = express.Router();

router.get("/:userId", getForecast);

module.exports = router;