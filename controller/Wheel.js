const Wheel = require("../models/Wheel");
const WheelCategories = require("../models/WheelCategories");
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
  req.body.isNew = (valueRequired(req.body.isNew) && req.body.isNew) || false;

  const uniqueName = await Wheel.find({ name: RegexOptions(req.body.name) });

  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length + 1);
  } else {
    req.body.slug = slugify(req.body.name);
  }

  let orderNumber = 1;

  const codeNumber = await Wheel.findOne({ status: true }).sort({ code: -1 });

  if (valueRequired(codeNumber) && valueRequired(codeNumber.code)) {
    orderNumber += parseInt(codeNumber.code);
  }

  req.body.wheelCode =
    "W" + req.body.diameter + "H" + req.body.boltPattern + "-" + orderNumber;

  req.body.code = orderNumber;
  req.body.diameter = parseInt(req.body.diameter);
  req.body.width = parseInt(req.body.width);
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

  const width = await Wheel.aggregate([
    { $group: { _id: "$width", count: { $sum: 1 } } },
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
    width,
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
  let sort = req.query.sort || "new";
  const select = req.query.select;

  const fields = [
    "diameter",
    "width",
    "boltPattern",
    "inSet",
    "offSet",
    "threadSize",
    "centerBore",
    "setOf",
    "rim",
  ];

  // NEWS FIELDS
  const categories = req.query.categoryname;
  const status = req.query.status;
  const name = req.query.name;
  const price = req.query.price;
  const discount = req.query.discount;
  const minDiameter = req.query.minDiameter;
  const maxDiameter = req.query.maxDiameter;
  const minWidth = req.query.minWidth;
  const maxWidth = req.query.maxWidth;
  const minPrice = req.query.minprice;
  const maxPrice = req.query.maxprice;
  const minDiscount = req.query.minDiscount;
  const maxDiscount = req.query.maxDiscount;
  const wheelCode = req.query.wheelCode;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Wheel.find();

  fields.map((field) => {
    if (valueRequired(req.query[field])) {
      const qry = req.query[field];
      let arrayList = [];

      if (field == "diameter" || field == "setOf") {
        const result = qry.split(",");
        result.map((el) => arrayList.push(parseInt(el)));
      } else {
        arrayList = qry.split(",");
      }

      if (arrayList.length > 0) {
        query.where(field).in(arrayList);
      } else {
        query.find({ field: RegexOptions(req.query[field]) });
      }
    }
  });

  if (valueRequired(categories)) {
    const names = categories.split(",");
    const match = [];
    names.map((name) => {
      match.push({ name: RegexOptions(name) });
    });

    const array = await WheelCategories.find({ $or: match }).select("_id");

    query.where("wheelCategories").in(array.map((el) => el._id));
  }

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(wheelCode))
    query.find({ wheelCode: RegexOptions(wheelCode) });

  if (valueRequired(name)) query.find({ name: RegexOptions(name) });
  if (valueRequired(price)) query.find({ price });
  if (valueRequired(discount)) query.find({ discount });

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

  if (valueRequired(minWidth) && valueRequired(maxWidth)) {
    query.find({
      width: { $gte: minWidth, $lte: maxWidth },
    });
  } else if (valueRequired(maxWidth) && valueRequired(minWidth) === false)
    query.find({
      width: { $lte: maxWidth },
    });
  else if (valueRequired(maxWidth) === false && valueRequired(minWidth))
    query.find({
      width: { $gte: minWidth },
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
    if (sort === "new") {
      query.sort({ createAt: -1 });
    } else if (sort === "old") {
      query.sort({ createAt: 1 });
    } else if (sort === "cheap") {
      query.sort({ price: 1 });
    } else if (sort === "expensive") {
      query.sort({ price: -1 });
    } else if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      if (spliteSort.length > 0) {
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

      const splite = sort.split("_");
      if (splite.length > 0) {
        let convertSort = {};
        if (splite[1] === "ascend") {
          convertSort = { [splite[0]]: 1 };
        } else {
          convertSort = { [splite[0]]: -1 };
        }
        if (splite[0] != "undefined") query.sort(convertSort);
      } else {
        query.sort(sort);
      }
    }
  }

  query.select(select);
  query.populate("createUser");
  query.populate("updateUser");
  query.populate("wheelCategories");

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
  const width = req.query.width;
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
  if (valueRequired(width)) query.find({ width: RegexOptions(width) });
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
  const width = req.query.width;
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
  if (valueRequired(width)) query.find({ width: RegexOptions(width) });
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

exports.wheelSearchControl = asyncHandler(async (req, res) => {
  const userInputs = req.query;
  const query = {};

  const fields = [
    "diameter",
    "width",
    "boltPattern",
    "inSet",
    "offSet",
    "rim",
    "threadSize",
    "centerBore",
    "minprice",
    "maxprice",
    "setOf",
  ];

  const categories = userInputs["categoryname"];

  query["status"] = true;

  fields.map((field) => {
    if (
      valueRequired(userInputs[field]) &&
      userInputs[field].split(",").length > 0
    ) {
      if (field === "minprice" || field === "maxprice") {
      } else if (field === "diameter" || field === "setOf") {
      } else {
        const arrayList = userInputs[field].split(",");
        query[field] = { $in: arrayList };
      }
    }
  });

  if (
    valueRequired(userInputs["minprice"]) &&
    valueRequired(userInputs["maxprice"])
  ) {
    query["price"] = {
      $gte: parseInt(userInputs["minprice"]),
      $lte: parseInt(userInputs["maxprice"]),
    };
  } else if (
    valueRequired(userInputs["maxprice"]) &&
    valueRequired(userInputs["minprice"]) === false
  )
    query["price"] = { $lte: parseInt(userInputs["maxprice"]) };
  else if (
    valueRequired(userInputs["maxprice"]) === false &&
    valueRequired(userInputs["minprice"])
  )
    query["price"] = {
      $gte: parseInt(userInputs["minprice"]),
    };

  if (valueRequired(categories)) {
    const names = categories.split(",");
    const match = [];
    names.map((name) => {
      match.push({ name: RegexOptions(name) });
    });

    const array = await WheelCategories.find({ $or: match }).select("_id");
    query["wheelCategories"] = { $in: array.map((el) => el._id) };
  }

  const diameterQuery = { ...query };
  delete diameterQuery["diameter"];

  const diameter = await Wheel.aggregate([
    { $match: diameterQuery },
    {
      $group: {
        _id: { diameter: "$diameter" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.diameter",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const widthQuery = { ...query };
  delete widthQuery["width"];

  const width = await Wheel.aggregate([
    { $match: widthQuery },
    {
      $group: {
        _id: { width: "$width" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.width",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const boltPatternQuery = { ...query };
  delete boltPatternQuery["boltPattern"];

  const boltPattern = await Wheel.aggregate([
    { $match: boltPatternQuery },
    {
      $group: {
        _id: { boltPattern: "$boltPattern" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.boltPattern",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const inSetQuery = { ...query };
  delete inSetQuery["inSet"];

  const inSet = await Wheel.aggregate([
    { $match: inSetQuery },
    {
      $group: {
        _id: { inSet: "$inSet" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.inSet",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const offSetQuery = { ...query };
  delete offSetQuery["offSet"];

  const offSet = await Wheel.aggregate([
    { $match: offSetQuery },
    {
      $group: {
        _id: { offSet: "$offSet" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.offSet",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const rimQuery = { ...query };
  delete rimQuery["rim"];

  const rim = await Wheel.aggregate([
    { $match: rimQuery },
    {
      $group: {
        _id: { rim: "$rim" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.rim",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const threadSizeQuery = { ...query };
  delete threadSizeQuery["threadSize"];

  const threadSize = await Wheel.aggregate([
    { $match: threadSizeQuery },
    {
      $group: {
        _id: { threadSize: "$threadSize" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.threadSize",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const centerBoreQuery = { ...query };
  delete centerBoreQuery["threadSize"];

  const centerBore = await Wheel.aggregate([
    { $match: centerBoreQuery },
    {
      $group: {
        _id: { centerBore: "$centerBore" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.centerBore",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const setOfQuery = { ...query };
  delete setOfQuery["threadSize"];

  const setOf = await Wheel.aggregate([
    { $match: setOfQuery },
    {
      $group: {
        _id: { setOf: "$setOf" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id.setOf",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const price = await Wheel.aggregate([
    {
      $facet: {
        min: [{ $sort: { price: 1 } }, { $limit: 1 }],
        max: [{ $sort: { price: -1 } }, { $limit: 1 }],
      },
    },
    {
      $project: {
        min: { $first: "$min.price" },
        max: { $first: "$max.price" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    userInputs,
    data: {
      diameter,
      width,
      boltPattern,
      inSet,
      offSet,
      rim,
      threadSize,
      centerBore,
      price,
      setOf,
    },
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
  const wheel = await Wheel.findById(req.params.id).populate("wheelCategories");

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

  const uniqueName = await Wheel.find({ name: RegexOptions(req.body.name) });

  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length + 1);
  } else {
    req.body.slug = slugify(req.body.name);
  }

  if (valueRequired(req.body.pictures) === false) {
    req.body.pictures = [];
  }

  if (!valueRequired(req.body.wheelCategories)) {
    req.body.wheelCategories = [];
  }

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
  const wheel = await Wheel.findOne({ slug: req.params.slug })
    .populate("createUser")
    .populate("wheelCategories");

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
