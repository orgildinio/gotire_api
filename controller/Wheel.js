const Wheel = require("../models/Wheel");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { slugify } = require("transliteration");
const { userSearch, RegexOptions } = require("../lib/searchOfterModel");

exports.createWheel = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;

  const uniqueName = await Wheel.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length);
  }

  let orderNumber = 1;

  const lastWheelCode = await Wheel.findOne({}).sort({ createAt: -1 });

  if (lastWheelCode) {
    const order = lastWheelCode.wheelCode.split("-");
    const code = parseInt(order[1]);
    orderNumber = orderNumber + code;
  }

  req.body.wheelCode =
    "W" + req.body.diameter + "H" + req.body.boltPattern + "-" + orderNumber;

  req.body.diameter = parseInt(req.body.diameter);
  req.body.height = parseInt(req.body.height);
  req.body.setOf = parseInt(req.body.setOf);

  const wheel = await Wheel.create(req.body);

  res.status(200).json({
    success: true,
    data: wheel,
  });
});

exports.wheelGroups = asyncHandler(async (req, res) => {
  const diameter = await Wheel.aggregate([
    { $group: { _id: "$diameter", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  const height = await Wheel.aggregate([
    { $group: { _id: "$height", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  const boltPattern = await Wheel.aggregate([
    { $group: { _id: "$boltPattern", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  const rim = await Wheel.aggregate([
    { $group: { _id: "$rim", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  const threadSize = await Wheel.aggregate([
    { $group: { _id: "$threadSize", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  res.status(200).json({
    success: true,
    diameter,
    height,
    boltPattern,
    rim,
    threadSize,
  });
});

exports.wheelGroup = asyncHandler(async (req, res) => {
  const groupName = req.params.group;
  const limit = parseInt(req.query.limit) || 100;
  let groupFiled;
  if (groupName) groupFiled = "$" + groupName;

  const group = await Wheel.aggregate([
    { $group: { _id: groupFiled, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: limit },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: group,
  });
});

exports.getWheels = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const diameter = req.query.diameter;
  const height = req.query.height;
  const boltPattern = req.query.boltPattern;
  const inSet = req.query.inSet;
  const offSet = req.query.offSet;
  const threadSize = req.query.threadSize;
  const centerBore = req.query.centerBore;
  const price = req.query.price;
  const discount = req.query.discount;
  const setOf = req.query.setOf;
  const minDiameter = req.query.minDiameter;
  const maxDiameter = req.query.maxDiameter;
  const minHeight = req.query.minHeight;
  const maxHeight = req.query.maxHeight;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const minDiscount = req.query.minDiscount;
  const maxDiscount = req.query.maxDiscount;
  const wheelCode = req.query.wheelCode;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Wheel.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(wheelCode))
    query.find({ wheelCode: RegexOptions(wheelCode) });
  if (valueRequired(name)) query.find({ name: RegexOptions(name) });
  if (valueRequired(height)) query.find({ height: RegexOptions(height) });
  if (valueRequired(diameter)) query.find({ diameter: RegexOptions(diameter) });
  if (valueRequired(boltPattern))
    query.find({ boltPattern: RegexOptions(boltPattern) });
  if (valueRequired(inSet)) query.find({ inSet: RegexOptions(inSet) });
  if (valueRequired(offSet)) query.find({ offSet: RegexOptions(offSet) });
  if (valueRequired(threadSize))
    query.find({ threadSize: RegexOptions(threadSize) });
  if (valueRequired(centerBore))
    query.find({ centerBore: RegexOptions(centerBore) });

  if (valueRequired(price)) query.find({ price });
  if (valueRequired(discount)) query.find({ discount });
  if (valueRequired(setOf)) query.find({ setOf });

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

  if (valueRequired(minDiameter) && valueRequired(maxDiameter)) {
    query.find({
      diameter: { $gte: minDiameter, $lte: maxDiameter },
    });
  } else if (valueRequired(maxDiameter) && valueRequired(minDiameter) === false)
    query.find({
      diameter: { $lte: maxDiameter },
    });
  else if (valueRequired(maxDiameter) === false && valueRequired(minDiameter))
    query.find({
      diameter: { $gte: minDiameter },
    });

  if (valueRequired(minHeight) && valueRequired(maxHeight)) {
    query.find({
      height: { $gte: minHeight, $lte: maxHeight },
    });
  } else if (valueRequired(maxHeight) && valueRequired(minHeight) === false)
    query.find({
      height: { $lte: maxHeight },
    });
  else if (valueRequired(maxHeight) === false && valueRequired(minHeight))
    query.find({
      height: { $gte: minHeight },
    });

  if (valueRequired(minPrice) && valueRequired(maxPrice)) {
    query.find({
      price: { $gte: minPrice, $lte: maxPrice },
    });
  } else if (valueRequired(maxPrice) && valueRequired(minPrice) === false)
    query.find({
      price: { $lte: maxPrice },
    });
  else if (valueRequired(maxPrice) === false && valueRequired(minPrice))
    query.find({
      price: { $gte: minPrice },
    });

  if (valueRequired(minDiscount) && valueRequired(maxDiscount)) {
    query.find({
      discount: { $gte: minDiscount, $lte: maxDiscount },
    });
  } else if (valueRequired(maxDiscount) && valueRequired(minDiscount) === false)
    query.find({
      discount: { $lte: maxDiscount },
    });
  else if (valueRequired(maxDiscount) === false && valueRequired(minDiscount))
    query.find({
      discount: { $gte: minDiscount },
    });

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

  const pagination = await paginate(page, limit, Wheel, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const wheel = await query.exec();

  res.status(200).json({
    success: true,
    count: wheel.length,
    data: wheel,
    pagination,
  });
});

const getFullData = async (req, page) => {
  const limit = 25;
  const select = req.query.select;

  //  FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const diameter = req.query.diameter;
  const height = req.query.height;
  const boltPattern = req.query.boltPattern;
  const inSet = req.query.inSet;
  const offSet = req.query.offSet;
  const threadSize = req.query.threadSize;
  const centerBore = req.query.centerBore;
  const price = req.query.price;
  const discount = req.query.discount;
  const setOf = req.query.setOf;
  const wheelCode = req.query.wheelCode;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Wheel.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(wheelCode))
    query.find({ wheelCode: RegexOptions(wheelCode) });
  if (valueRequired(name)) query.find({ name: RegexOptions(name) });
  if (valueRequired(height)) query.find({ height: RegexOptions(height) });
  if (valueRequired(diameter)) query.find({ diameter: RegexOptions(diameter) });
  if (valueRequired(boltPattern))
    query.find({ boltPattern: RegexOptions(boltPattern) });
  if (valueRequired(inSet)) query.find({ inSet: RegexOptions(inSet) });
  if (valueRequired(offSet)) query.find({ offSet: RegexOptions(offSet) });
  if (valueRequired(threadSize))
    query.find({ threadSize: RegexOptions(threadSize) });
  if (valueRequired(centerBore))
    query.find({ centerBore: RegexOptions(centerBore) });

  if (valueRequired(price)) query.find({ price });
  if (valueRequired(discount)) query.find({ discount });
  if (valueRequired(setOf)) query.find({ setOf });

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

  const pagination = await paginate(page, limit, Wheel, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const wheel = await query.exec();

  return wheel;
};

exports.excelData = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const diameter = req.query.diameter;
  const height = req.query.height;
  const boltPattern = req.query.boltPattern;
  const inSet = req.query.inSet;
  const offSet = req.query.offSet;
  const threadSize = req.query.threadSize;
  const centerBore = req.query.centerBore;
  const price = req.query.price;
  const discount = req.query.discount;
  const setOf = req.query.setOf;
  const wheelCode = req.query.wheelCode;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Wheel.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(wheelCode))
    query.find({ wheelCode: RegexOptions(wheelCode) });
  if (valueRequired(name)) query.find({ name: RegexOptions(name) });
  if (valueRequired(height)) query.find({ height: RegexOptions(height) });
  if (valueRequired(diameter)) query.find({ diameter: RegexOptions(diameter) });
  if (valueRequired(boltPattern))
    query.find({ boltPattern: RegexOptions(boltPattern) });
  if (valueRequired(inSet)) query.find({ inSet: RegexOptions(inSet) });
  if (valueRequired(offSet)) query.find({ offSet: RegexOptions(offSet) });
  if (valueRequired(threadSize))
    query.find({ threadSize: RegexOptions(threadSize) });
  if (valueRequired(centerBore))
    query.find({ centerBore: RegexOptions(centerBore) });

  if (valueRequired(price)) query.find({ price });
  if (valueRequired(discount)) query.find({ discount });
  if (valueRequired(setOf)) query.find({ setOf });

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
  const pagination = await paginate(page, limit, Wheel, result);
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

exports.multDeleteWheel = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findWheel = await Wheel.find({ _id: { $in: ids } });

  if (findWheel.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findWheel.map(async (el) => {
    el.pictures && (await imageDelete(el.pictures));
  });

  await Wheel.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getWheel = asyncHandler(async (req, res) => {
  const wheel = await Wheel.findById(req.params.id);

  if (!wheel) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: wheel,
  });
});

exports.updateWheel = asyncHandler(async (req, res, next) => {
  let wheel = await Wheel.findById(req.params.id);

  if (!wheel) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй олдсонгүй. ", 404);
  }

  const name = req.body.name;
  const nameUnique = await Wheel.find({}).where("name").equals(name);

  if (nameUnique.length > 1) {
    req.body.slug = slugify(req.body.name + "_" + nameUnique.length + 1);
  } else {
    req.body.slug = slugify(name);
  }

  if (valueRequired(req.body.pictures) === false) {
    req.body.pictures = [];
  }

  let orderNumber = 1;

  const lastWheelCode = await Wheel.findOne({}).sort({ createAt: -1 });

  if (lastWheelCode) {
    const order = lastWheelCode.wheelCode.split("-");
    const code = parseInt(order[1]);
    orderNumber = orderNumber + code;
  }

  req.body.wheelCode =
    "W" + req.body.diameter + "H" + req.body.boltPattern + "-" + orderNumber;

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  wheel = await Wheel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: wheel,
  });
});

exports.getCountWheel = asyncHandler(async (req, res, next) => {
  const wheel = await Wheel.count();
  res.status(200).json({
    success: true,
    data: wheel,
  });
});

exports.getSlugWheel = asyncHandler(async (req, res, next) => {
  const wheel = await Wheel.findOne({ slug: req.params.slug }).populate(
    "createUser"
  );

  if (!wheel) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  wheel.views = wheel.views + 1;
  wheel.update();

  res.status(200).json({
    success: true,
    data: wheel,
  });
});
