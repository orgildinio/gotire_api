const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  getCallBackPayment,
  createInvoice,
  getQpayToken,
} = require("../controller/Qpay");

router.route("/").get(getQpayToken);

router.route("/create").post(createInvoice);
router.route("/call").get(getCallBackPayment);

module.exports = router;
