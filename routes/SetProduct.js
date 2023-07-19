const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createSetProduct,
  getSetProduct,
  setProductSearchControl,
  getRandomSetProducts,
  getSlugSetProduct,
  updateSetProduct,
  multDeleteSetProduct,
  getSetProducts,
} = require("../controller/SetProduct");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createSetProduct)
  .get(getSetProducts);

router.route("/search").get(setProductSearchControl);
router.route("/random").get(getRandomSetProducts);

router.route("/slug/:slug").get(getSlugSetProduct);

router
  .route("/:id")
  .get(getSetProduct)
  .put(protect, authorize("admin", "operator"), updateSetProduct);

router
  .route("/delete")
  .delete(protect, authorize("admin"), multDeleteSetProduct);

module.exports = router;
