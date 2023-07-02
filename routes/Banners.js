const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createBanner,
  getBanners,
  multDeleteBanner,
  getBanner,
  updateBanner,
} = require("../controller/Banners");

router
  .route("/")
  .post(protect, authorize("admin"), createBanner)
  .get(getBanners);

router.route("/delete").delete(protect, authorize("admin"), multDeleteBanner);
router
  .route("/:id")
  .get(protect, authorize("admin", "operator"), getBanner)
  .put(protect, authorize("admin"), updateBanner);

module.exports = router;
