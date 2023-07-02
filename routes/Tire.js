const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createTire,
  getTires,
  getTire,
  updateTire,
  multDeleteTire,
  getSlugTire,
} = require("../controller/Tire");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createTire)
  .get(getTires);

router.route("/slug/:slug").get(getSlugTire);

router
  .route("/:id")
  .get(getTire)
  .put(protect, authorize("admin", "operator"), updateTire);

router.route("/delete").delete(protect, authorize("admin"), multDeleteTire);

module.exports = router;
