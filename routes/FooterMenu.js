const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  updateFooterMenu,
  createFooterMenu,
  getFooterMenus,
  changePosition,
  getFooterMenu,
  deletetFooterMenu,
} = require("../controller/FooterMenu");

router
  .route("/")
  .post(protect, authorize("admin"), createFooterMenu)
  .get(getFooterMenus);

router.route("/change").post(protect, authorize("admin"), changePosition);

// "/api/v1/News-categories/id"
router
  .route("/:id")
  .get(getFooterMenu)
  .delete(protect, authorize("admin"), deletetFooterMenu)
  .put(protect, authorize("admin"), updateFooterMenu);

module.exports = router;
