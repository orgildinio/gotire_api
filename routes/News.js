const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createNews,
  getNews,
  multDeleteNews,
  getSingleNews,
  updateNews,
  getCountNews,
  getAllNews,
  excelData,
  getSlugNews,
} = require("../controller/News");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createNews)
  .get(getNews);

router.route("/excel").get(excelData);

router.route("/c").get(getAllNews);
router.route("/slug/:slug").post(getSlugNews);

router
  .route("/count")
  .get(protect, authorize("admin", "operator"), getCountNews);
router.route("/delete").delete(protect, authorize("admin"), multDeleteNews);
router
  .route("/:id")
  .get(getSingleNews)
  .put(protect, authorize("admin", "operator"), updateNews);

module.exports = router;
