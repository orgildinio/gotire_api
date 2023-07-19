const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  multDeleteProduct,
  getSlugProduct,
  productGroups,
  productGroup,
  productSearchControl,
} = require("../controller/Product");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createProduct)
  .get(getProducts);

router.route("/search").get(productSearchControl);
router.route("/groups").get(productGroups);
router.route("/groups/:group").get(productGroup);
router.route("/slug/:slug").get(getSlugProduct);

router
  .route("/:id")
  .get(getProduct)
  .put(protect, authorize("admin", "operator"), updateProduct);

router.route("/delete").delete(protect, authorize("admin"), multDeleteProduct);

module.exports = router;
