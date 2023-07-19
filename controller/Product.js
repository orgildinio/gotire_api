const Product = require("../models/Product");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { slugify } = require("transliteration");
const { userSearch, RegexOptions } = require("../lib/searchOfterModel");

exports.createProduct = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;
  req.body.isNew = (valueRequired(req.body.isNew) && req.body.isNew) || false;

  const uniqueName = await Product.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length);
  } else {
    req.body.slug = slugify(req.body.name);
  }

  let orderNumber = 1;

  const codeNumber = await Product.findOne({ status: true }).sort({ code: -1 });

  if (valueRequired(codeNumber) && valueRequired(codeNumber.code)) {
    orderNumber += parseInt(codeNumber.code);
  }

  req.body.productCode = "P" + orderNumber;
  req.body.setOf = parseInt(req.body.setOf);

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    data: product,
  });
});

exports.productGroups = asyncHandler(async (req, res) => {
  const diameter = await Product.aggregate([
    { $group: { _id: "$diameter", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  const width = await Product.aggregate([
    { $group: { _id: "$width", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  const boltPattern = await Product.aggregate([
    { $group: { _id: "$boltPattern", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  const rim = await Product.aggregate([
    { $group: { _id: "$rim", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  const threadSize = await Product.aggregate([
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

exports.productGroup = asyncHandler(async (req, res) => {
  const groupName = req.params.group;
  const limit = parseInt(req.query.limit) || 100;
  let groupFiled;
  if (groupName) groupFiled = "$" + groupName;

  const group = await Product.aggregate([
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

exports.getProducts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const price = req.query.price;
  const discount = req.query.discount;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const productCode = req.query.productCode;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Product.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(productCode))
    query.find({ productCode: RegexOptions(productCode) });

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
  query.populate("productCategories");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Product, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const product = await query.exec();

  res.status(200).json({
    success: true,
    count: product.length,
    data: product,
    pagination,
  });
});

const getFullData = async (req, page) => {
  const limit = 25;
  const select = req.query.select;

  //  FIELDS
  //  FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const price = req.query.price;
  const discount = req.query.discount;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const productCode = req.query.productCode;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Product.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(productCode))
    query.find({ productCode: RegexOptions(productCode) });

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
  query.populate("productCategories");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Product, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const product = await query.exec();

  return product;
};

exports.excelData = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  //  FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const price = req.query.price;
  const discount = req.query.discount;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const productCode = req.query.productCode;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Product.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(productCode))
    query.find({ productCode: RegexOptions(productCode) });

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
  query.populate("productCategories");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, Product, result);
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

exports.productSearchControl = asyncHandler(async (req, res) => {
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

  const diameterQuery = { ...query };
  delete diameterQuery["diameter"];

  const diameter = await Product.aggregate([
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

  const width = await Product.aggregate([
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

  const boltPattern = await Product.aggregate([
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

  const inSet = await Product.aggregate([
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

  const offSet = await Product.aggregate([
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

  const rim = await Product.aggregate([
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

  const threadSize = await Product.aggregate([
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

  const centerBore = await Product.aggregate([
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

  const setOf = await Product.aggregate([
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

  const price = await Product.aggregate([
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

exports.multDeleteProduct = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findProduct = await Product.find({ _id: { $in: ids } });

  if (findProduct.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findProduct.map(async (el) => {
    el.pictures && (await imageDelete(el.pictures));
  });

  await Product.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "productCategories"
  );

  if (!product) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй олдсонгүй. ", 404);
  }

  const name = req.body.name;
  const nameUnique = await Product.find({}).where("name").equals(name);

  if (nameUnique.length > 1) {
    req.body.slug = slugify(req.body.name + "_" + nameUnique.length + 1);
  } else {
    req.body.slug = slugify(name);
  }

  if (valueRequired(req.body.pictures) === false) {
    req.body.pictures = [];
  }

  if (!valueRequired(req.body.productCategories)) {
    req.body.productCategories = [];
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: product,
  });
});

exports.getCountProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.count();
  res.status(200).json({
    success: true,
    data: product,
  });
});

exports.getSlugProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("createUser")
    .populate("productCategories");

  if (!product) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  product.views = product.views + 1;
  product.update();

  res.status(200).json({
    success: true,
    data: product,
  });
});
