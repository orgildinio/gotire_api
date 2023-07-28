const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  createOrder,
  getCountOrder,
  getOrders,
  multDeleteOrder,
  updateOrder,
  getOrder,
  getTodayCount,
  cartCheck,
  updateUserOrder,
  getUserOrders,
  getUserOrder,
} = require("../controller/Order");

router
  .route("/")
  .post(protect, createOrder)
  .get(protect, authorize("admin", "operator"), getOrders);

router.route("/cart").post(cartCheck);
router.route("/user").get(protect, getUserOrders);

router
  .route("/user/:id")
  .get(protect, getUserOrder)
  .put(protect, updateUserOrder);
router
  .route("/todaycount")
  .get(protect, authorize("admin", "operator"), getTodayCount);

router
  .route("/count")
  .get(protect, authorize("admin", "operator"), getCountOrder);

router.route("/delete").delete(protect, authorize("admin"), multDeleteOrder);
router
  .route("/:id")
  .get(protect, authorize("admin", "operator"), getOrder)
  .put(protect, authorize("admin", "operator"), updateOrder);

module.exports = router;
