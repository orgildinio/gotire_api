const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createSetProductCategorires,
  getSetProductCategories,
  deletetSetProductCategorires,
  changePosition,
  updateSetProductCategorires,
  getSlugCategory,
  getSetProductCategory,
} = require("../controller/SetProductCategories");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createSetProductCategorires)
  .get(getSetProductCategories);

router
  .route("/change")
  .post(protect, authorize("admin", "operator"), changePosition);

router.route("/slug/:slug").get(getSlugCategory);

// "/api/v1/News-categories/id"
router
  .route("/:id")
  .get(getSetProductCategory)
  .delete(protect, authorize("admin"), deletetSetProductCategorires)
  .put(protect, authorize("admin", "operator"), updateSetProductCategorires);

module.exports = router;
