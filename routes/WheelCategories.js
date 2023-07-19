const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createWheelCategorires,
  getWheelCategories,
  deletetWheelCategorires,
  changePosition,
  updateWheelCategorires,
  getSlugCategory,
  getWheelCategory,
} = require("../controller/WheelCategories");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createWheelCategorires)
  .get(getWheelCategories);

router
  .route("/change")
  .post(protect, authorize("admin", "operator"), changePosition);

router.route("/slug/:slug").get(getSlugCategory);

// "/api/v1/News-categories/id"
router
  .route("/:id")
  .get(getWheelCategory)
  .delete(protect, authorize("admin"), deletetWheelCategorires)
  .put(protect, authorize("admin", "operator"), updateWheelCategorires);

module.exports = router;
