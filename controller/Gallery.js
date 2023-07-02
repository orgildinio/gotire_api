const Gallery = require("../models/Gallery");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { userSearch, RegexOptions } = require("../lib/searchOfterModel");

exports.createGallery = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;

  const gallery = await Gallery.create(req.body);
  res.status(200).json({
    success: true,
    data: gallery,
  });
});

exports.getGallerys = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // BANNER FIELDS
  const name = req.query.name;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const status = req.query.status;

  const query = Gallery.find();

  if (valueRequired(name)) query.find({ name: RegexOptions(name) });

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

  const pagination = await paginate(page, limit, Gallery, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const gallery = await query.exec();

  res.status(200).json({
    success: true,
    count: gallery.length,
    data: gallery,
    pagination,
  });
});

exports.getFullData = asyncHandler(async (req, res, next) => {
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  const name = req.query.name;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const status = req.query.status;

  const query = Gallery.find();

  if (valueRequired(name)) query.find({ name: RegexOptions(name) });

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

  const gallerys = await query.exec();

  res.status(200).json({
    success: true,
    count: gallerys.length,
    data: gallerys,
  });
});

exports.multDeleteGallery = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findGallery = await Gallery.find({ _id: { $in: ids } });

  if (findGallery.length <= 0) {
    throw new MyError("Таны сонгосон өгөгдөл олдсонгүй", 400);
  }

  findGallery.map(async (el) => {
    el.picture && (await imageDelete(el.picture));
  });

  const gallery = await Gallery.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getGallery = asyncHandler(async (req, res, next) => {
  const gallery = await Gallery.findByIdAndUpdate(req.params.id)
    .populate("createUser")
    .populate("updateUser");

  if (!gallery) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: gallery,
  });
});

exports.updateGallery = asyncHandler(async (req, res, next) => {
  let gallery = await Gallery.findById(req.params.id);

  if (!gallery) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  gallery = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: gallery,
  });
});

exports.getCountGallery = asyncHandler(async (req, res, next) => {
  const gallery = await Gallery.count();
  res.status(200).json({
    success: true,
    data: gallery,
  });
});
