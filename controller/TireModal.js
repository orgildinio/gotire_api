const TireModal = require("../models/TireModal");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { userSearch, RegexOptions } = require("../lib/searchOfterModel");

exports.createTireModal = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;

  const tireModal = await TireModal.create(req.body);

  res.status(200).json({
    success: true,
    data: tireModal,
  });
});

exports.getTireModals = asyncHandler(async (req, res, next) => {
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

  const query = TireModal.find();

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

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, TireModal, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const tireModal = await query.exec();

  res.status(200).json({
    success: true,
    count: tireModal.length,
    data: tireModal,
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

  const query = TireModal.find();

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
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, TireModal, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const tireModal = await query.exec();

  return tireModal;
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

  const query = TireModal.find();

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

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, TireModal, result);
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

exports.multDeleteTireModal = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findTireModal = await TireModal.find({ _id: { $in: ids } });

  if (findTireModal.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findTireModal.map(async (el) => {
    el.logo && (await imageDelete(el.logo));
  });

  await TireModal.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getTireModal = asyncHandler(async (req, res, next) => {
  const tireModal = await TireModal.findById(req.params.id);

  if (!tireModal) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  tireModal.views = tireModal.views + 1;
  tireModal.save();

  res.status(200).json({
    success: true,
    data: tireModal,
  });
});

exports.updateTireModal = asyncHandler(async (req, res, next) => {
  let tireModal = await TireModal.findById(req.params.id);

  if (!tireModal) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  if (valueRequired(req.body.logo) === false) {
    req.body.logo = "";
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  tireModal = await TireModal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: tireModal,
  });
});

exports.getCountTireModal = asyncHandler(async (req, res, next) => {
  const tireModal = await TireModal.count();
  res.status(200).json({
    success: true,
    data: tireModal,
  });
});
