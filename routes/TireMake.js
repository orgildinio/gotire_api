const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createTireMake,
  getTireMakes,
  getTireMake,
  updateTireMake,
  excelData,
  multDeleteTireMake,
} = require("../controller/TireMake");

router.route("/excel").get(excelData);

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createTireMake)
  .get(getTireMakes);

router
  .route("/:id")
  .get(getTireMake)
  .put(protect, authorize("admin", "operator"), updateTireMake);

router.route("/delete").delete(protect, authorize("admin"), multDeleteTireMake);

module.exports = router;
