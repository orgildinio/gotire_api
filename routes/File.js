const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const { uploadFile } = require("../controller/fileUpload");

router.route("/").post(protect, uploadFile);

module.exports = router;
