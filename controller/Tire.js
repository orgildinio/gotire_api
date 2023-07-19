const Tire = require("../models/Tire");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { slugify } = require("transliteration");
const {
  userSearch,
  useTireMake,
  useTireModal,
  RegexOptions,
} = require("../lib/searchOfterModel");
const TireModal = require("../models/TireModal");

exports.createTire = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;
  req.body.width = parseInt(req.body.width);
  req.body.height = parseInt(req.body.height);
  req.body.diameter = parseInt(req.body.diameter);

  const uniqueName = await Tire.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length);
  } else {
    req.body.slug = slugify(req.body.name);
  }

  let orderNumber = 1;
  let modalShort = "";

  const codeNumber = await Tire.findOne({ status: true }).sort({ code: -1 });

  if (valueRequired(codeNumber) && valueRequired(codeNumber.code)) {
    orderNumber += parseInt(codeNumber.code);
  }

  if (valueRequired(req.body.modal)) {
    const result = await TireModal.findById(req.body.modal);

    if (result) {
      modalShort = result.shortName;
    }
  }
  req.body.tireCode =
    "T" +
    req.body.diameter +
    req.body.width +
    req.body.height +
    "-" +
    modalShort +
    "-" +
    orderNumber;

  req.body.code = orderNumber;

  const tire = await Tire.create(req.body);

  res.status(200).json({
    success: true,
    data: tire,
  });
});

exports.getMostTire = asyncHandler(async (req, res) => {
  const limit = 18;
});

exports.getTires = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const name = req.query.name;
  const make = req.query.make;
  const modal = req.query.modal;
  const width = req.query.width;
  const height = req.query.height;
  const diameter = req.query.diameter;
  const year = req.query.year;
  const use = req.query.use;
  const season = req.query.season;
  const price = req.query.price;
  const discount = req.query.discount;
  const setOf = req.query.setof;
  const minWidth = req.query.minWidth;
  const maxWidth = req.query.maxWidth;
  const minHeight = req.query.minHeight;
  const maxHeight = req.query.maxHeight;
  const minDiameter = req.query.minDiameter;
  const maxDiameter = req.query.maxDiameter;
  const minYear = req.query.minYear;
  const maxYear = req.query.maxYear;
  const minUse = req.query.minUse;
  const maxUse = req.query.maxUse;
  const minPrice = req.query.minprice;
  const maxPrice = req.query.maxprice;
  const minDiscount = req.query.minDiscount;
  const maxDiscount = req.query.maxDiscount;
  const minSetOf = req.query.minSetOf;
  const maxSetOf = req.query.maxSetOf;
  const tireCode = req.query.tireCode;
  const tiresize = req.query.tiresize;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Tire.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(tiresize)) {
    const tiresizeArray = tiresize.split(",");
    let width = [];
    let height = [];
    let diameter = [];
    if (tiresizeArray.length > 0) {
      tiresizeArray.map((size) => {
        const splitSlash = size.split("/");
        const splitDiameter = splitSlash[1].split("R");
        width.push(parseInt(splitSlash[0]));
        height.push(parseInt(splitDiameter[0]));
        diameter.push(parseInt(splitDiameter[1]));
      });
    }

    query.where("width").in(width);
    query.where("height").in(height);
    query.where("diameter").in(diameter);
  }

  if (valueRequired(make)) {
    let arrayMake = make.split(",");

    if (arrayMake.length > 0) {
      await arrayMake.map(async (el) => {
        const makeIds = await useTireMake(el);
        query.where("make").in(makeIds);
      });
    }
  }

  if (valueRequired(tireCode)) query.find({ tireCode: RegexOptions(tireCode) });
  if (valueRequired(modal)) {
    let arrayModal = modal.split(",");
    if (arrayModal.length > 0) {
      query.where("modal").in(arrayModal);
    } else {
      const modalIds = await useTireModal(modal);
      if (modalIds.length > 0) {
        query.where("modal").in(modalIds);
      }
    }
  }

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

  if (valueRequired(width)) query.find({ width: RegexOptions(width) });
  if (valueRequired(height)) query.find({ height: RegexOptions(height) });
  if (valueRequired(diameter)) query.find({ diameter: RegexOptions(diameter) });
  if (valueRequired(year)) query.find({ year });
  if (valueRequired(use)) query.find({ use });
  if (valueRequired(season)) {
    let arraySeason = season.split(",");
    if (arraySeason.length > 0) {
      query.where("season").in(arraySeason);
    } else {
      query.find({ season });
    }
  }
  if (valueRequired(price)) query.find({ price });
  if (valueRequired(discount)) query.find({ discount });
  if (valueRequired(setOf)) query.find({ setOf });

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

  if (valueRequired(minYear) && valueRequired(maxYear)) {
    query.find({
      year: { $gte: minYear, $lte: maxYear },
    });
  } else if (valueRequired(maxYear) && valueRequired(minYear) === false)
    query.find({
      year: { $lte: maxYear },
    });
  else if (valueRequired(maxYear) === false && valueRequired(minYear))
    query.find({
      year: { $gte: minYear },
    });

  if (valueRequired(minUse) && valueRequired(maxUse)) {
    query.find({
      use: { $gte: minUse, $lte: maxUse },
    });
  } else if (valueRequired(maxUse) && valueRequired(minUse) === false)
    query.find({
      use: { $lte: maxUse },
    });
  else if (valueRequired(maxUse) === false && valueRequired(minUse))
    query.find({
      use: { $gte: minUse },
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

  if (valueRequired(minSetOf) && valueRequired(maxSetOf)) {
    query.find({
      setOf: { $gte: minSetOf, $lte: maxSetOf },
    });
  } else if (valueRequired(maxSetOf) && valueRequired(minSetOf) === false)
    query.find({
      setOf: { $lte: maxSetOf },
    });
  else if (valueRequired(maxSetOf) === false && valueRequired(minSetOf))
    query.find({
      setOf: { $gte: minSetOf },
    });

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
  query.populate("make");
  query.populate("tireCategories");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Tire, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const tire = await query.exec();

  res.status(200).json({
    success: true,
    count: tire.length,
    data: tire,
    pagination,
  });
});

function getRandomArbitrary(min, max) {
  return Math.ceil(Math.random() * (max - min) + min);
}

exports.getRandomTires = asyncHandler(async (req, res) => {
  const limitrecords = 8;
  Tire.count().exec(function (err, count) {
    // Get a random entry

    let skipRecords = getRandomArbitrary(1, count - limitrecords);
    // Again query all users but only fetch one offset by our random #
    Tire.find()
      .skip(skipRecords)
      .populate("make")
      .populate("modal")
      .exec(function (err, result) {
        res.status(200).json({
          success: true,
          data: result,
        });
      });
  });
});

exports.tireSearchControl = asyncHandler(async (req, res) => {
  const userInputs = req.query;
  const query = {};

  const fields = [
    "make",
    "tiresize",
    "use",
    "season",
    "setof",
    "minprice",
    "maxprice",
  ];

  fields.map((field) => {
    if (
      valueRequired(userInputs[field]) &&
      userInputs[field].split(",").length > 0
    ) {
      if (field === "tiresize") {
        const tiresizeArray = userInputs[field].split(",");
        let width = [];
        let height = [];
        let diameter = [];
        if (tiresizeArray.length > 0) {
          tiresizeArray.map((size) => {
            const splitSlash = size.split("/");
            const splitDiameter = splitSlash[1].split("R");
            width.push(parseInt(splitSlash[0]));
            height.push(parseInt(splitDiameter[0]));
            diameter.push(parseInt(splitDiameter[1]));
          });
        }

        query["width"] = { $in: width };
        query["height"] = { $in: height };
        query["diameter"] = { $in: diameter };
      } else if (field === "use" || field === "setof") {
        const arrayList = userInputs[field].split(",");
        if (field === "setof") field = "setOf";
        query[field] = { $in: arrayList.map((el) => parseInt(el)) };
      } else if (field === "make") {
      } else if (field === "minprice" || field === "maxprice") {
      } else {
        const arrayList = userInputs[field].split(",");
        query[field] = { $in: arrayList };
      }
    }
  });

  if (valueRequired(userInputs["make"])) {
    const arrayList = await useTireMake(userInputs["make"]);
    query["make"] = arrayList[0]._id;
  }

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

  const make = await Tire.aggregate([
    { $match: query },
    { $group: { _id: "$make", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "tiremakes",
        localField: "_id",
        foreignField: "_id",
        as: "makeDatas",
      },
    },

    {
      $project: {
        name: 1,
        makeDatas: 1,
        count: 1,
      },
    },

    { $sort: { count: -1 } },
  ]);

  const modal = await Tire.aggregate([
    {
      $group: {
        _id: { modal: "$modal" },
        count: { $sum: 1 },
      },
    },

    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
    { $sort: { count: -1 } },
  ]);

  const tiresizeQuery = { ...query };
  delete tiresizeQuery["width"];
  delete tiresizeQuery["height"];
  delete tiresizeQuery["diameter"];

  const tiresize = await Tire.aggregate([
    { $match: tiresizeQuery },
    {
      $group: {
        _id: { width: "$width", height: "$height", diameter: "$diameter" },
        count: { $sum: 1 },
      },
    },

    {
      $project: {
        width: "$_id.width",
        height: "$_id.height",
        diameter: "$_id.diameter",
        count: "$count",
      },
    },
    { $sort: { width: -1, height: -1 } },
  ]);

  const year = await Tire.aggregate([
    { $match: query },
    {
      $group: {
        _id: { year: "$year" },
        count: { $sum: 1 },
      },
    },

    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
    { $sort: { count: -1 } },
  ]);

  const useQuery = { ...query };
  delete useQuery["use"];

  const use = await Tire.aggregate([
    { $match: useQuery },
    {
      $group: {
        _id: { use: "$use" },
        count: { $sum: 1 },
      },
    },

    {
      $project: {
        name: "$_id.use",
        count: "$count",
      },
    },
    { $sort: { name: -1 } },
  ]);

  const seasonQuery = { ...query };
  delete seasonQuery["season"];

  const season = await Tire.aggregate([
    { $match: seasonQuery },
    {
      $group: {
        _id: { season: "$season" },
        count: { $sum: 1 },
      },
    },

    {
      $project: {
        name: "$_id.season",
        count: "$count",
      },
    },
    { $sort: { count: -1 } },
  ]);

  const price = await Tire.aggregate([
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

  const setofQuery = { ...query };
  delete setofQuery["setOf"];

  const setOf = await Tire.aggregate([
    { $match: setofQuery },
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
    { $sort: { count: 1 } },
  ]);

  res.status(200).json({
    success: true,
    userInputs,
    data: {
      make,
      modal,
      tiresize,
      year,
      use,
      season,
      price,
      setOf,
    },
  });
});

exports.getSearchDatas = asyncHandler(async (req, res) => {
  const tires = await Tire.aggregate([
    {
      $group: {
        id: { $push: "$_id" },
        slug: { $push: "$slug" },
        _id: { width: "$width", height: "$height", diameter: "$diameter" },
      },
    },

    {
      $project: {
        _id: { $first: "$id" },
        slug: { $first: "$slug" },
        width: "$_id.width",
        height: "$_id.height",
        diameter: "$_id.diameter",
        count: "$count",
      },
    },
    { $sort: { creatAt: -1 } },
    { $limit: 18 },
  ]);

  res.status(200).json({
    success: true,
    data: tires,
  });
});

const getFullData = async (req, page) => {
  const limit = 25;
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const star = req.query.star;
  const name = req.query.name;
  const type = req.query.type;
  const tireCode = req.query.tireCode;
  const categories = req.query.categories;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  let sort = req.query.sort || { createAt: -1 };
  const query = Tire.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }
  if (valueRequired(tireCode)) query.find({ tireCode: RegexOptions(tireCode) });
  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

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
      let convertSort = {};
      if (spliteSort[1] === "ascend") {
        convertSort = { [spliteSort[0]]: 1 };
      } else {
        convertSort = { [spliteSort[0]]: -1 };
      }
      if (spliteSort[0] != "undefined") query.sort(convertSort);
    }
  }

  if (valueRequired(star)) {
    if (star.split(",").length > 1) {
      query.where("star").in(star.split(","));
    } else query.where("star").equals(star);
  }

  if (valueRequired(type)) {
    query.find({ type: { $regex: ".*" + type + ".*", $options: "i" } });
  }

  query.select(select);

  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Tire, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const tire = await query.exec();

  return tire;
};

exports.tireGroups = asyncHandler(async (req, res) => {
  const widthQuery = req.query.width || null;
  const heightQuery = req.query.height || null;

  const width = await Tire.aggregate([
    { $group: { _id: "$width", count: { $sum: 1 } } },
    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
  ]);

  let height = "";

  if (valueRequired(widthQuery)) {
    height = await Tire.aggregate([
      {
        $match: {
          width: parseInt(widthQuery),
        },
      },
      { $group: { _id: "$height", count: { $sum: 1 } } },
      {
        $project: {
          name: "$_id",
          count: "$count",
        },
      },
    ]);
  } else {
    height = await Tire.aggregate([
      { $group: { _id: "$height", count: { $sum: 1 } } },
      {
        $project: {
          name: "$_id",
          count: "$count",
        },
      },
    ]);
  }

  let diameter = "";

  if (valueRequired(heightQuery) && valueRequired(widthQuery)) {
    diameter = await Tire.aggregate([
      {
        $match: {
          $and: [
            { width: parseInt(widthQuery) },
            { height: parseInt(heightQuery) },
          ],
        },
      },
      { $group: { _id: "$diameter", count: { $sum: 1 } } },
      {
        $project: {
          name: "$_id",
          count: "$count",
        },
      },
    ]);
  } else {
    diameter = await Tire.aggregate([
      { $group: { _id: "$diameter", count: { $sum: 1 } } },
      {
        $project: {
          name: "$_id",
          count: "$count",
        },
      },
    ]);
  }

  res.status(200).json({
    success: true,
    diameter,
    height,
    width,
  });
});

exports.tireGroup = asyncHandler(async (req, res) => {
  const groupName = req.params.group;
  const limit = parseInt(req.query.limit) || 100;
  let groupFiled;
  if (groupName) groupFiled = "$" + groupName;

  const group = await Tire.aggregate([
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

exports.excelData = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const star = req.query.star;
  const name = req.query.name;
  const type = req.query.type;
  const categories = req.query.categories;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const tireCode = req.query.tireCode;
  const query = Tire.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(star)) {
    const splitData = star.split(",");
    if (splitData.length > 1) {
      query.where("star").in(star.split(","));
    } else query.where("star").equals(star);
  }
  if (valueRequired(tireCode)) query.find({ tireCode: RegexOptions(tireCode) });
  if (valueRequired(type)) {
    query.find({ type: { $regex: ".*" + type + ".*", $options: "i" } });
  }

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

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

  if (valueRequired(categories)) {
    const splitData = categories.split(",");
    if (splitData.length > 1) {
      query.where("categories").in(splitData);
    } else {
      query.where("categories").in(categories);
    }
  }
  if (valueRequired(status)) query.where("status").equals(status);

  query.select(select);
  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, Tire, result);
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

exports.multDeleteTire = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findTire = await Tire.find({ _id: { $in: ids } });

  if (findTire.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findTire.map(async (el) => {
    el.pictures && (await imageDelete(el.pictures));
  });

  await Tire.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getTire = asyncHandler(async (req, res, next) => {
  const tire = await Tire.findById(req.params.id).populate("tireCategories");

  if (!tire) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: tire,
  });
});

exports.updateTire = asyncHandler(async (req, res, next) => {
  let tire = await Tire.findById(req.params.id);

  if (!tire) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  const name = req.body.name;
  const uniqueName = await Tire.find({ name: req.body.name });
  if (uniqueName.length > 1) {
    req.body.slug = slugify(name + "_" + uniqueName.length + 1);
  } else {
    req.body.slug = slugify(name);
  }

  if (valueRequired(req.body.pictures) === false) {
    req.body.pictures = [];
  }

  if (!valueRequired(req.body.tireCategories)) {
    req.body.tireCategories = [];
  }

  let orderNumber = 1;
  let modalShort = "";
  const lastTireCode = await Tire.findOne({}).sort({ createAt: -1 });

  if (lastTireCode) {
    const order = lastTireCode.tireCode.split("-");
    const code = parseInt(order[2]);
    orderNumber = orderNumber + code;
  }

  if (valueRequired(req.body.modal)) {
    const result = await TireModal.findById(req.body.modal);

    if (result) {
      modalShort = result.shortName;
    }
  }
  req.body.tireCode =
    "T" +
    req.body.diameter +
    req.body.width +
    req.body.height +
    "-" +
    modalShort +
    "-" +
    orderNumber;

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  tire = await Tire.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: tire,
  });
});

exports.getCountTire = asyncHandler(async (req, res, next) => {
  const tire = await Tire.count();
  res.status(200).json({
    success: true,
    data: tire,
  });
});

exports.getSlugTire = asyncHandler(async (req, res, next) => {
  const tire = await Tire.findOne({ slug: req.params.slug })
    .populate("createUser")
    .populate("make")
    .populate("tireCategories");

  if (!tire) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  tire.views = tire.views + 1;
  tire.update();

  res.status(200).json({
    success: true,
    data: tire,
  });
});
