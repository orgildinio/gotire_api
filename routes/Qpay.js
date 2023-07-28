const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const { createInvoice, getCallBackPayment } = require("../controller/Qpay");

router.route("/").post(protect, createInvoice);
router.route("/check").get(protect, getCallBackPayment);

module.exports = router;
