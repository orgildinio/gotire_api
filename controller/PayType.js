const Paytype = require("../models/PayType");

const User = require("../models/User");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");

exports.createPaytype = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;

  const paytype = await Paytype.create(req.body);
  res.status(200).json({
    success: true,
    data: paytype,
  });
});

const useSearch = async (userFirstname) => {
  const userData = await User.find({
    firstName: { $regex: ".*" + userFirstname + ".*", $options: "i" },
  }).select("_id");
  return userData;
};

exports.getPaytypes = asyncHandler(async (req, res, next) => {
  // PARTNER FIELDS

  const paytype = await Paytype.find();

  res.status(200).json({
    success: true,
    count: paytype.length,
    data: paytype,
  });
});

exports.multDeletePaytype = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;

  const paytype = await Paytype.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getPaytype = asyncHandler(async (req, res, next) => {
  const paytype = await Paytype.findByIdAndUpdate(req.params.id);

  if (!paytype) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: paytype,
  });
});

exports.updatePaytype = asyncHandler(async (req, res, next) => {
  let paytype = await Paytype.findById(req.params.id);

  if (!paytype) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  paytype = await Paytype.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: paytype,
  });
});

exports.getCountPaytype = asyncHandler(async (req, res, next) => {
  const paytype = await Paytype.count();
  res.status(200).json({
    success: true,
    data: paytype,
  });
});
