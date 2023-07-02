const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createPage,
  getPages,
  getFullData,
  getCountPage,
  multDeletePage,
  getPage,
  updatePage,
  getSlugPage,
} = require("../controller/Page");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createPage)
  .get(getPages);

router.route("/excel").get(getFullData);
router.route("/slug/:slug").get(getSlugPage);
router
  .route("/count")
  .get(protect, authorize("admin", "operator"), getCountPage);
router.route("/delete").delete(protect, authorize("admin"), multDeletePage);
router
  .route("/:id")
  .get(getPage)
  .put(protect, authorize("admin", "operator"), updatePage);

module.exports = router;
