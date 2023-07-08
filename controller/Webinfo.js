const WebInfo = require("../models/Webinfo");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");

const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");

exports.createWebInfo = asyncHandler(async (req, res, next) => {
  const webinfo = await WebInfo.create(req.body);

  res.status(200).json({
    success: true,
    data: webinfo,
  });
});

exports.getWebInfo = asyncHandler(async (req, res, next) => {
  const query = WebInfo.findOne({}).sort({ createAt: -1 });
  const webinfo = await query.exec();

  res.status(200).json({
    success: true,
    data: webinfo,
  });
});

exports.updateWebInfo = asyncHandler(async (req, res, next) => {
  const data = await WebInfo.findOne({}).sort({ createAt: -1 });
  const webinfo = await WebInfo.findByIdAndUpdate(data._id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    data: webinfo,
  });
});
