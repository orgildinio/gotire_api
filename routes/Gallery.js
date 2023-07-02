const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createGallery,
  multDeleteGallery,
  getFullData,
  getGallery,
  updateGallery,
  getGallerys,
} = require("../controller/Gallery");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createGallery)
  .get(getGallerys);
router
  .route("/excel")
  .get(protect, authorize("admin", "operator"), getFullData);
router.route("/delete").delete(protect, authorize("admin"), multDeleteGallery);
router
  .route("/:id")
  .get(getGallery)
  .put(protect, authorize("admin", "operator"), updateGallery);

module.exports = router;
