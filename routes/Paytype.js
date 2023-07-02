const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createPaytype,
  updatePaytype,
  getPaytypes,
  multDeletePaytype,
  getPaytype,
} = require("../controller/PayType");

router
  .route("/")
  .post(protect, authorize("admin", "operator"), createPaytype)
  .get(getPaytypes);

router.route("/delete").delete(protect, authorize("admin"), multDeletePaytype);

router
  .route("/:id")
  .get(getPaytype)
  .put(protect, authorize("admin", "operator"), updatePaytype);

module.exports = router;
