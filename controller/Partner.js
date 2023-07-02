const Partner = require("../models/Partner");

const User = require("../models/User");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { userSearch } = require("../lib/searchOfterModel");

exports.createPartner = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;

  const partner = await Partner.create(req.body);
  res.status(200).json({
    success: true,
    data: partner,
  });
});

exports.getPartners = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // PARTNER FIELDS
  const name = req.query.name;
  const link = req.query.link;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const status = req.query.status;

  const query = Partner.find();

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

  if (valueRequired(link))
    query.find({ link: { $regex: ".*" + link + ".*", $options: "i" } });

  if (valueRequired(createUser)) {
    const userData = await userSearch(createUser);
    if (userData) query.where("createUser").in(userData);
  }

  if (valueRequired(updateUser)) {
    const userData = await userSearch(updateUser);
    if (userData) query.where("updateUser").in(userData);
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      let convertSort = {};
      if (spliteSort[1] === "ascend") {
        convertSort = { [spliteSort[0]]: 1 };
      } else {
        convertSort = { [spliteSort[0]]: -1 };
      }
      if (spliteSort[0] != "undefined") query.sort(convertSort);
    } else {
      query.sort(sort);
    }
  }

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  query.select(select);
  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Partner, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const partner = await query.exec();

  res.status(200).json({
    success: true,
    count: partner.length,
    data: partner,
    pagination,
  });
});

exports.getFullData = asyncHandler(async (req, res, next) => {
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // PARTNER FIELDS
  const name = req.query.name;
  const link = req.query.link;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const status = req.query.status;

  const query = Partner.find();

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

  if (valueRequired(link))
    query.find({ link: { $regex: ".*" + link + ".*", $options: "i" } });

  if (valueRequired(createUser)) {
    const userData = await userSearch(createUser);
    if (userData) query.where("createUser").in(userData);
  }

  if (valueRequired(updateUser)) {
    const userData = await userSearch(updateUser);
    if (userData) query.where("updateUser").in(userData);
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      let convertSort = {};
      if (spliteSort[1] === "ascend") {
        convertSort = { [spliteSort[0]]: 1 };
      } else {
        convertSort = { [spliteSort[0]]: -1 };
      }
      if (spliteSort[0] != "undefined") query.sort(convertSort);
    } else {
      query.sort(sort);
    }
  }
  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  query.select(select);
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const partners = await query.exec();

  res.status(200).json({
    success: true,
    count: partners.length,
    data: partners,
  });
});

exports.multDeletePartner = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findPartner = await Partner.find({ _id: { $in: ids } });

  if (findPartner.length <= 0) {
    throw new MyError("Таны сонгосон өгөгдөл олдсонгүй", 400);
  }
  findPartner.map(async (el) => {
    el.cover && (await imageDelete(el.cover));
    el.logo && (await imageDelete(el.logo));
  });

  const partner = await Partner.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getPartner = asyncHandler(async (req, res, next) => {
  const partner = await Partner.findByIdAndUpdate(req.params.id)
    .populate("createUser")
    .populate("updateUser");

  if (!partner) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: partner,
  });
});

exports.updatePartner = asyncHandler(async (req, res, next) => {
  let partner = await Partner.findById(req.params.id);

  if (!partner) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  if (valueRequired(req.body.cover) === false) {
    req.body.cover = "";
  }

  if (valueRequired(req.body.logo) === false) {
    req.body.logo = "";
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  partner = await Partner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: partner,
  });
});

exports.getCountPartner = asyncHandler(async (req, res, next) => {
  const partner = await Partner.count();
  res.status(200).json({
    success: true,
    data: partner,
  });
});
