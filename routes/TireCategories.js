const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createTireCategorires,
  getTireCategories,
  deletetTireCategorires,
  changePosition,
  updateTireCategorires,
  getSlugCategory,
  getTireCategory,
} = require("../controller/TireCategories");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createTireCategorires)
  .get(getTireCategories);

router
  .route("/change")
  .post(protect, authorize("admin", "operator"), changePosition);

router.route("/slug/:slug").get(getSlugCategory);

// "/api/v1/News-categories/id"
router
  .route("/:id")
  .get(getTireCategory)
  .delete(protect, authorize("admin"), deletetTireCategorires)
  .put(protect, authorize("admin", "operator"), updateTireCategorires);

module.exports = router;
