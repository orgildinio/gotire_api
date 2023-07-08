const TireMake = require("../models/TireMake");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { userSearch, RegexOptions } = require("../lib/searchOfterModel");

exports.createTireMake = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;

  const tireMake = await TireMake.create(req.body);

  res.status(200).json({
    success: true,
    data: tireMake,
  });
});

exports.getTireMakes = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const shortName = req.query.shortName;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = TireMake.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(name)) query.find({ name: RegexOptions(name) });

  if (valueRequired(shortName))
    query.find({ shortName: RegexOptions(shortName) });

  if (valueRequired(createUser)) {
    const userData = await userSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await userSearch(updateUser);
    if (userData) {
      query.where("updateUser").in(userData);
    }
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      if (spliteSort.length > 0) {
        let convertSort = {};
        if (spliteSort[1] === "ascend") {
          convertSort = { [spliteSort[0]]: 1 };
        } else {
          convertSort = { [spliteSort[0]]: -1 };
        }
        if (spliteSort[0] != "undefined") query.sort(convertSort);
      }

      const splite = sort.split("_");
      if (splite.length > 0) {
        let convertSort = {};
        if (splite[1] === "ascend") {
          convertSort = { [splite[0]]: 1 };
        } else {
          convertSort = { [splite[0]]: -1 };
        }
        if (splite[0] != "undefined") query.sort(convertSort);
      }
    } else {
      query.sort(sort);
    }
  }

  query.select(select);
  query.populate("createUser");
  query.populate("updateUser");
  query.populate("tireCount");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, TireMake, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const tireMake = await query.exec();

  res.status(200).json({
    success: true,
    count: tireMake.length,
    data: tireMake,
    pagination,
  });
});

const getFullData = async (req, page) => {
  const limit = 25;
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const shortName = req.query.shortName;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = TireMake.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(name)) query.find({ name: RegexOptions(name) });

  if (valueRequired(shortName))
    query.find({ shortName: RegexOptions(shortName) });

  if (valueRequired(createUser)) {
    const userData = await userSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await userSearch(updateUser);
    if (userData) {
      query.where("updateUser").in(userData);
    }
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      if (spliteSort.length > 0) {
        let convertSort = {};
        if (spliteSort[1] === "ascend") {
          convertSort = { [spliteSort[0]]: 1 };
        } else {
          convertSort = { [spliteSort[0]]: -1 };
        }
        if (spliteSort[0] != "undefined") query.sort(convertSort);
      }

      const splite = sort.split("_");
      if (splite.length > 0) {
        let convertSort = {};
        if (splite[1] === "ascend") {
          convertSort = { [splite[0]]: 1 };
        } else {
          convertSort = { [splite[0]]: -1 };
        }
        if (splite[0] != "undefined") query.sort(convertSort);
      }
    } else {
      query.sort(sort);
    }
  }

  query.select(select);
  query.populate("tireCount");
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, TireMake, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const tireMake = await query.exec();

  return tireMake;
};

exports.excelData = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const shortName = req.query.shortName;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = TireMake.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(name)) query.find({ name: RegexOptions(name) });

  if (valueRequired(shortName))
    query.find({ shortName: RegexOptions(shortName) });

  if (valueRequired(createUser)) {
    const userData = await userSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await userSearch(updateUser);
    if (userData) {
      query.where("updateUser").in(userData);
    }
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      if (spliteSort.length > 0) {
        let convertSort = {};
        if (spliteSort[1] === "ascend") {
          convertSort = { [spliteSort[0]]: 1 };
        } else {
          convertSort = { [spliteSort[0]]: -1 };
        }
        if (spliteSort[0] != "undefined") query.sort(convertSort);
      }

      const splite = sort.split("_");
      if (splite.length > 0) {
        let convertSort = {};
        if (splite[1] === "ascend") {
          convertSort = { [splite[0]]: 1 };
        } else {
          convertSort = { [splite[0]]: -1 };
        }
        if (splite[0] != "undefined") query.sort(convertSort);
      }
    } else {
      query.sort(sort);
    }
  }

  query.select(select);
  query.populate("createUser");
  query.populate("updateUser");
  query.populate("tireCount");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, TireMake, result);
  const pageCount = pagination.pageCount;
  let datas = [];

  for (let i = 1; i <= pageCount; i++) {
    const res = await getFullData(req, i);
    datas.push(...res);
  }

  res.status(200).json({
    success: true,
    data: datas,
  });
});

exports.multDeleteTireMake = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findTireMake = await TireMake.find({ _id: { $in: ids } });

  if (findTireMake.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findTireMake.map(async (el) => {
    el.logo && (await imageDelete(el.logo));
  });

  await TireMake.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getTireMake = asyncHandler(async (req, res, next) => {
  const tireMake = await TireMake.findById(req.params.id).populate("tireCount");

  if (!tireMake) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  tireMake.views = tireMake.views + 1;
  tireMake.save();

  res.status(200).json({
    success: true,
    data: tireMake,
  });
});

exports.updateTireMake = asyncHandler(async (req, res, next) => {
  let tireMake = await TireMake.findById(req.params.id);

  if (!tireMake) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  if (valueRequired(req.body.logo) === false) {
    req.body.logo = "";
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  tireMake = await TireMake.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: tireMake,
  });
});

exports.getCountTireMake = asyncHandler(async (req, res, next) => {
  const tireMake = await TireMake.count();
  res.status(200).json({
    success: true,
    data: tireMake,
  });
});
