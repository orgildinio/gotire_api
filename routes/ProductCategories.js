const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createProductCategorires,
  getProductCategories,
  deletetProductCategorires,
  changePosition,
  updateProductCategorires,
  getSlugCategory,
  getProductCategory,
} = require("../controller/ProductCategories");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createProductCategorires)
  .get(getProductCategories);

router
  .route("/change")
  .post(protect, authorize("admin", "operator"), changePosition);

router.route("/slug/:slug").get(getSlugCategory);

// "/api/v1/News-categories/id"
router
  .route("/:id")
  .get(getProductCategory)
  .delete(protect, authorize("admin"), deletetProductCategorires)
  .put(protect, authorize("admin", "operator"), updateProductCategorires);

module.exports = router;
