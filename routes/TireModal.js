const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createTireModal,
  getTireModals,
  getTireModal,
  updateTireModal,
  multDeleteTireModal,
} = require("../controller/TireModal");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createTireModal)
  .get(getTireModals);

router
  .route("/:id")
  .get(getTireModal)
  .put(protect, authorize("admin", "operator"), updateTireModal);

router
  .route("/delete")
  .delete(protect, authorize("admin"), multDeleteTireModal);

module.exports = router;
