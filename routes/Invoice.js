const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  getInvoices,
  multDeleteInvoice,
  updateInvoice,
  getInvoice,
} = require("../controller/Invoice");

router.route("/").get(protect, authorize("admin"), getInvoices);

router.route("/delete").delete(protect, authorize("admin"), multDeleteInvoice);
router
  .route("/:id")
  .get(protect, getInvoice)
  .put(protect, authorize("admin"), updateInvoice);

module.exports = router;
