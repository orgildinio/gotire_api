const SetProduct = require("../models/SetProduct");
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
  useProductCategories,
} = require("../lib/searchOfterModel");

exports.createSetProduct = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;
  req.body.star = (valueRequired(req.body.start) && req.body.star) || false;
  req.body.isDiscount =
    (valueRequired(req.body.isDiscount) && req.body.isDiscount) || false;

  const values = req.body;
  req.body.tire = {
    make: values.tiremake,
    modal: values.tiremodal,
    width: values.tirewidth,
    height: values.tireheight,
    diameter: values.tirediameter,
    use: values.tireuse,
    season: values.tireseason,
  };
  req.body.wheel = {
    diameter: values.wheeldiameter,
    width: values.wheelwidth,
    boltPattern: values.wheelboltPattern,
    rim: values.wheelrim,
    threadSize: values.wheelthreadSize,
    centerBore: values.wheelcenterBore,
  };

  const arrayTireFields = ["width", "height", "diameter", "use", "setOf"];
  const arrayWheelFields = ["diameter", "width", "boltPattern"];

  const uniqueName = await SetProduct.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length);
  } else {
    req.body.slug = slugify(req.body.name);
  }

  if (!valueRequired(req.body.setProductCategories)) {
    delete req.body.setProductCategories;
  }

  arrayTireFields.map((el) => {
    req.body["tire"][el] = parseInt(req.body["tire"][el]);
  });

  arrayWheelFields.map((el) => {
    req.body["wheel"][el] = parseInt(req.body["wheel"][el]);
  });

  let orderNumber = 1;

  const codeNumber = await SetProduct.findOne({ status: true }).sort({
    code: -1,
  });

  if (valueRequired(codeNumber) && valueRequired(codeNumber.code)) {
    orderNumber += parseInt(codeNumber.code);
  }

  req.body.setofCode =
    "WT" +
    req.body["tire"].diameter +
    "B" +
    req.body["wheel"].boltPattern +
    "-" +
    orderNumber;

  const setof = await SetProduct.create(req.body);

  res.status(200).json({
    success: true,
    data: setof,
  });
});

exports.getSetProducts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  const tiresize = req.query.tiresize;
  const setProductCategories = req.query.setProductCategories;
  const make = req.query.make;
  const modal = req.query.modal;
  const minPrice = req.query.minprice;
  const maxPrice = req.query.maxprice;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const arrayBooleanFields = ["star", "isDiscount", "status", "isNew"];
  const arrayStringFields = [
    "name",
    "tire",
    "setofCode",
    "tire-season",
    "wheel-boltPattern",
    "wheel-rim",
    "wheel-threadSize",
    "wheel-centerBore",
  ];
  const arrayInitFields = [
    "tire-use",
    "setOf",
    "wheel-diameter",
    "wheel-width",
    "price",
    "discount",
  ];

  const query = SetProduct.find();

  arrayBooleanFields.map((el) => {
    if (valueRequired(req.query[el])) {
      const data = req.query[el];
      if (data.split(",").length > 1) {
        query.where(el).in(data.split(","));
      } else query.where(el).equals(data);
    }
  });

  arrayStringFields.map((field) => {
    if (valueRequired(req.query[field])) {
      let arrayField = req.query[field].split(",");
      const data = arrayField;

      const splitField = req.query[field].split("-");
      if (splitField.length >= 2) {
        const fld = splitField[0] + "." + splitField[1];
        query.where(fld).in(data);
      } else {
        query.where(field).in(data);
      }
    }
  });

  arrayInitFields.map((field) => {
    if (valueRequired(req.query[field])) {
      let arrayField = req.query[field].split(",");
      const data = arrayField.map((el) => parseInt(el));

      const splitField = req.query[field].split("-");
      if (splitField.length >= 2) {
        const fld = splitField[0] + "." + splitField[1];
        query.where(fld).in(data);
      } else {
        query.where(field).in(data);
      }
    }
  });

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

    query.where("tire.width").in(width);
    query.where("tire.height").in(height);
    query.where("tire.diameter").in(diameter);
  }

  if (valueRequired(setProductCategories)) {
    const categoriesId = await useProductCategories(setProductCategories);
    query.where("setProductCategories").in(categoriesId);
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
  query.populate("tire.make");
  query.populate("tire.modal");
  query.populate("setProductCategories");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, SetProduct, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const setof = await query.exec();

  res.status(200).json({
    success: true,
    count: setof.length,
    data: setof,
    pagination,
  });
});

function getRandomArbitrary(min, max) {
  return Math.ceil(Math.random() * (max - min) + min);
}

exports.getRandomSetProducts = asyncHandler(async (req, res) => {
  const limitrecords = 8;
  SetProduct.count().exec(function (err, count) {
    // Get a random entry

    let skipRecords = getRandomArbitrary(1, count - limitrecords);
    // Again query all users but only fetch one offset by our random #
    SetProduct.find()
      .skip(skipRecords)
      .populate("tire.make")
      .populate("tire.modal")
      .exec(function (err, result) {
        res.status(200).json({
          success: true,
          data: result,
        });
      });
  });
});

exports.setProductSearchControl = asyncHandler(async (req, res) => {
  const userInputs = req.query;
  const query = {};
  const tiresize = req.query.tiresize;
  const setProductCategories = req.query.setProductCategories;
  const arrayBooleanFields = ["star", "isDiscount", "status", "isNew"];
  const arrayStringFields = [
    "name",
    "tire",
    "setofCode",
    "tire-season",
    "wheel-boltPattern",
    "wheel-rim",
    "wheel-threadSize",
    "wheel-centerBore",
  ];
  const arrayInitFields = [
    "tire-use",
    "setOf",
    "wheel-diameter",
    "wheel-width",
    "price",
    "discount",
  ];

  if (valueRequired(tiresize)) {
    const setofsizeArray = userInputs["tiresize"].split(",");
    let width = [];
    let height = [];
    let diameter = [];
    if (setofsizeArray.length > 0) {
      setofsizeArray.map((size) => {
        const splitSlash = size.split("/");
        const splitDiameter = splitSlash[1].split("R");
        width.push(parseInt(splitSlash[0]));
        height.push(parseInt(splitDiameter[0]));
        diameter.push(parseInt(splitDiameter[1]));
      });
    }

    query["tire.width"] = { $in: width };
    query["tire.height"] = { $in: height };
    query["tire.diameter"] = { $in: diameter };
  }

  arrayStringFields.map((field) => {
    if (valueRequired(req.query[field])) {
      let arrayField = req.query[field].split(",");
      const data = arrayField;

      const splitField = req.query[field].split("-");
      if (splitField.length >= 2) {
        const fld = splitField[0] + "." + splitField[1];
        query[fld] = { $in: data };
      } else {
        query[field] = { $in: data };
      }
    }
  });

  arrayInitFields.map((field) => {
    if (valueRequired(req.query[field])) {
      let arrayField = req.query[field].split(",");
      const data = arrayField.map((el) => parseInt(el));

      const splitField = req.query[field].split("-");
      if (splitField.length >= 2) {
        const fld = splitField[0] + "." + splitField[1];
        query[fld] = { $in: data };
      } else {
        query[field] = { $in: data };
      }
    }
  });

  if (valueRequired(setProductCategories)) {
    const categoriesId = await useProductCategories(setProductCategories);
    query["setProductCategories"] = { $in: categoriesId };
  }

  if (valueRequired(userInputs["make"])) {
    const arrayList = await useTireMake(userInputs["make"]);
    query["tire.make"] = arrayList[0]._id;
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

  const make = await SetProduct.aggregate([
    { $match: query },
    { $group: { _id: "$tire.make", count: { $sum: 1 } } },
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

  const modal = await SetProduct.aggregate([
    { $group: { _id: "$tire.modal", count: { $sum: 1 } } },

    {
      $project: {
        name: "$_id",
        count: "$count",
      },
    },
    { $sort: { count: -1 } },
  ]);

  const tiresizeQuery = { ...query };
  delete tiresizeQuery["tire.width"];
  delete tiresizeQuery["tire.height"];
  delete tiresizeQuery["tire.diameter"];

  const tiresizeResult = await SetProduct.aggregate([
    { $match: tiresizeQuery },
    {
      $group: {
        _id: {
          width: "$tire.width",
          height: "$tire.height",
          diameter: "$tire.diameter",
        },
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

  const useQuery = { ...query };
  delete useQuery["tire.use"];

  const use = await SetProduct.aggregate([
    { $match: useQuery },
    {
      $group: {
        _id: { use: "$tire.use" },
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
  delete seasonQuery["tire.season"];

  const season = await SetProduct.aggregate([
    { $match: seasonQuery },
    {
      $group: {
        _id: { season: "$tire.season" },
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

  const price = await SetProduct.aggregate([
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

  const setOf = await SetProduct.aggregate([
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

  const diameterQuery = { ...query };
  delete diameterQuery["wheel.diameter"];

  const diameter = await SetProduct.aggregate([
    { $match: diameterQuery },
    {
      $group: {
        _id: { diameter: "$wheel.diameter" },
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
  delete widthQuery["wheel.width"];

  const width = await SetProduct.aggregate([
    { $match: widthQuery },
    {
      $group: {
        _id: { width: "$wheel.width" },
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
  delete boltPatternQuery["wheel.boltPattern"];

  const boltPattern = await SetProduct.aggregate([
    { $match: boltPatternQuery },
    {
      $group: {
        _id: { boltPattern: "$wheel.boltPattern" },
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

  const rimQuery = { ...query };
  delete rimQuery["wheel.rim"];

  const rim = await SetProduct.aggregate([
    { $match: rimQuery },
    {
      $group: {
        _id: { rim: "$wheel.rim" },
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
  delete threadSizeQuery["wheel.threadSize"];

  const threadSize = await SetProduct.aggregate([
    { $match: threadSizeQuery },
    {
      $group: {
        _id: { threadSize: "$wheel.threadSize" },
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
  delete centerBoreQuery["wheel.threadSize"];

  const centerBore = await SetProduct.aggregate([
    { $match: centerBoreQuery },
    {
      $group: {
        _id: { centerBore: "$wheel.centerBore" },
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

  res.status(200).json({
    success: true,
    userInputs,
    data: {
      tire: {
        make,
        modal,
        tiresizeResult,
        use,
        season,
      },

      wheel: {
        diameter,
        width,
        boltPattern,
        rim,
        threadSize,
        centerBore,
      },

      price,
      setOf,
    },
  });
});

exports.getSearchDatas = asyncHandler(async (req, res) => {
  const setofs = await SetProduct.aggregate([
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
    data: setofs,
  });
});

const getFullData = async (req, page) => {
  const limit = 25;
  const select = req.query.select;

  //  FIELDS
  const tiresize = req.query.tiresize;
  const make = req.query.make;
  const modal = req.query.modal;
  const minPrice = req.query.minprice;
  const maxPrice = req.query.maxprice;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const arrayBooleanFields = ["star", "isDiscount", "status", "isNew"];
  const arrayStringFields = [
    "name",
    "tire",
    "setofCode",
    "tire-season",
    "wheel-boltPattern",
    "wheel-rim",
    "wheel-threadSize",
    "wheel-centerBore",
  ];
  const arrayInitFields = [
    "tire-use",
    "setOf",
    "wheel-diameter",
    "wheel-width",
    "price",
    "discount",
  ];

  const query = SetProduct.find();

  arrayBooleanFields.map((el) => {
    if (valueRequired(req.query[el])) {
      const data = req.query[el];
      if (data.split(",").length > 1) {
        query.where(el).in(data.split(","));
      } else query.where(el).equals(data);
    }
  });

  arrayStringFields.map((field) => {
    if (valueRequired(req.query[field])) {
      let arrayField = req.query[field].split(",");
      const data = arrayField;

      const splitField = req.query[field].split("-");
      if (splitField.length >= 2) {
        const fld = splitField[0] + "." + splitField[1];
        query.where(fld).in(data);
      } else {
        query.where(field).in(data);
      }
    }
  });

  arrayInitFields.map((field) => {
    if (valueRequired(req.query[field])) {
      let arrayField = req.query[field].split(",");
      const data = arrayField.map((el) => parseInt(el));

      const splitField = req.query[field].split("-");
      if (splitField.length >= 2) {
        const fld = splitField[0] + "." + splitField[1];
        query.where(fld).in(data);
      } else {
        query.where(field).in(data);
      }
    }
  });

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

    query.where("tire.width").in(width);
    query.where("tire.height").in(height);
    query.where("tire.diameter").in(diameter);
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
  query.populate("tire.make");
  query.populate("tire.modal");
  query.populate("setProductCategories");
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, SetProduct, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const setof = await query.exec();

  return setof;
};

exports.setofGroups = asyncHandler(async (req, res) => {
  const widthQuery = req.query.width || null;
  const heightQuery = req.query.height || null;

  const width = await SetProduct.aggregate([
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
    height = await SetProduct.aggregate([
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
    height = await SetProduct.aggregate([
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
    diameter = await SetProduct.aggregate([
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
    diameter = await SetProduct.aggregate([
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

exports.setofGroup = asyncHandler(async (req, res) => {
  const groupName = req.params.group;
  const limit = parseInt(req.query.limit) || 100;
  let groupFiled;
  if (groupName) groupFiled = "$" + groupName;

  const group = await SetProduct.aggregate([
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

  //  FIELDS
  const tiresize = req.query.tiresize;
  const make = req.query.make;
  const modal = req.query.modal;
  const minPrice = req.query.minprice;
  const maxPrice = req.query.maxprice;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const arrayBooleanFields = ["star", "isDiscount", "status", "isNew"];
  const arrayStringFields = [
    "name",
    "tire",
    "setofCode",
    "tire-season",
    "wheel-boltPattern",
    "wheel-rim",
    "wheel-threadSize",
    "wheel-centerBore",
  ];
  const arrayInitFields = [
    "tire-use",
    "setOf",
    "wheel-diameter",
    "wheel-width",
    "price",
    "discount",
  ];

  const query = SetProduct.find();

  arrayBooleanFields.map((el) => {
    if (valueRequired(req.query[el])) {
      const data = req.query[el];
      if (data.split(",").length > 1) {
        query.where(el).in(data.split(","));
      } else query.where(el).equals(data);
    }
  });

  arrayStringFields.map((field) => {
    if (valueRequired(req.query[field])) {
      let arrayField = req.query[field].split(",");
      const data = arrayField;

      const splitField = req.query[field].split("-");
      if (splitField.length >= 2) {
        const fld = splitField[0] + "." + splitField[1];
        query.where(fld).in(data);
      } else {
        query.where(field).in(data);
      }
    }
  });

  arrayInitFields.map((field) => {
    if (valueRequired(req.query[field])) {
      let arrayField = req.query[field].split(",");
      const data = arrayField.map((el) => parseInt(el));

      const splitField = req.query[field].split("-");
      if (splitField.length >= 2) {
        const fld = splitField[0] + "." + splitField[1];
        query.where(fld).in(data);
      } else {
        query.where(field).in(data);
      }
    }
  });

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

    query.where("tire.width").in(width);
    query.where("tire.height").in(height);
    query.where("tire.diameter").in(diameter);
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
  query.populate("tire.make");
  query.populate("tire.modal");
  query.populate("setProductCategories");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, SetProduct, result);
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

exports.multDeleteSetProduct = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findSetProduct = await SetProduct.find({ _id: { $in: ids } });

  if (findSetProduct.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findSetProduct.map(async (el) => {
    el.pictures && (await imageDelete(el.pictures));
  });

  await SetProduct.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getSetProduct = asyncHandler(async (req, res, next) => {
  const setof = await SetProduct.findById(req.params.id)
    .populate("setProductCategories")
    .populate("tire.make")
    .populate("tire.modal");

  if (!setof) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: setof,
  });
});

exports.updateSetProduct = asyncHandler(async (req, res, next) => {
  let setof = await SetProduct.findById(req.params.id);

  if (!setof) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  const values = req.body;
  req.body.tire = {
    make: values.tiremake,
    modal: values.tiremodal,
    width: values.tirewidth,
    height: values.tireheight,
    diameter: values.tirediameter,
    use: values.tireuse,
    season: values.tireseason,
  };
  req.body.wheel = {
    diameter: values.wheeldiameter,
    width: values.wheelwidth,
    boltPattern: values.wheelboltPattern,
    rim: values.wheelrim,
    threadSize: values.wheelthreadSize,
    centerBore: values.wheelcenterBore,
  };

  const name = req.body.name;
  const uniqueName = await SetProduct.find({ name: req.body.name });
  if (uniqueName.length > 1) {
    req.body.slug = slugify(name + "_" + uniqueName.length + 1);
  } else {
    req.body.slug = slugify(name);
  }

  if (valueRequired(req.body.pictures) === false) {
    req.body.pictures = [];
  }

  if (!valueRequired(req.body.setProductCategories)) {
    req.body.setProductCategories = [];
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  setof = await SetProduct.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: setof,
  });
});

exports.getCountSetProduct = asyncHandler(async (req, res, next) => {
  const setof = await SetProduct.count();
  res.status(200).json({
    success: true,
    data: setof,
  });
});

exports.getSlugSetProduct = asyncHandler(async (req, res, next) => {
  const setof = await SetProduct.findOne({ slug: req.params.slug })
    .populate("createUser")
    .populate("tire.make")
    .populate("setProductCategories");

  if (!setof) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  setof.views = setof.views + 1;
  setof.update();

  res.status(200).json({
    success: true,
    data: setof,
  });
});
