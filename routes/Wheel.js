const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createWheel,
  getWheels,
  getWheel,
  updateWheel,
  multDeleteWheel,
  getSlugWheel,
  wheelGroups,
  wheelGroup,
} = require("../controller/Wheel");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createWheel)
  .get(getWheels);

router.route("/groups").get(wheelGroups);
router.route("/groups/:group").get(wheelGroup);
router.route("/slug/:slug").get(getSlugWheel);

router
  .route("/:id")
  .get(getWheel)
  .put(protect, authorize("admin", "operator"), updateWheel);

router.route("/delete").delete(protect, authorize("admin"), multDeleteWheel);

module.exports = router;
