const Service = require("../models/Service");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const User = require("../models/User");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { slugify } = require("transliteration");

exports.createService = asyncHandler(async (req, res) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;

  const uniqueName = await Service.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length);
  }

  const service = await Service.create(req.body);
  res.status(200).json({
    success: true,
    data: service,
  });
});

const useSearch = async (userFirstname) => {
  const userData = await User.find({
    firstName: { $regex: ".*" + userFirstname + ".*", $options: "i" },
  }).select("_id");
  return userData;
};

exports.getServices = asyncHandler(async (req, res) => {
  // Эхлээд query - уудаа аваад хоосон үгүйг шалгаад утга олгох
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;

  // FIELDS
  const status = req.query.status;
  const direct = req.query.direct;
  const name = req.query.name;
  const link = req.query.link;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  let sort = req.query.sort || { createAt: -1 };

  const query = Service.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(direct)) {
    if (direct.split(",").length > 1)
      query.where("direct").in(direct.split(","));
    else query.where("direct").in(direct);
  }

  if (valueRequired(link))
    query.find({ driect: { $regex: ".*" + link + ".*", $options: "i" } });

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

  if (valueRequired(createUser)) {
    const userData = await useSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await useSearch(updateUser);
    if (userData) {
      query.where("updateUser").in(userData);
    }
  }
  query.sort(sort);

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

  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, null, result);
  query.skip(pagination.start - 1);
  query.limit(limit);

  const service = await query.exec();

  res.status(200).json({
    success: true,
    count: service.length,
    data: service,
    pagination,
  });
});

const getFullData = async (req, page) => {
  const limit = 25;
  const select = req.query.select;

  // FIELDS
  const status = req.query.status;
  const direct = req.query.direct;
  const name = req.query.name;
  const link = req.query.link;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  let sort = req.query.sort || { createAt: -1 };

  const query = Service.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(direct)) {
    if (direct.split(",").length > 1)
      query.where("direct").in(direct.split(","));
    else query.where("direct").in(direct);
  }

  if (valueRequired(link))
    query.find({ driect: { $regex: ".*" + link + ".*", $options: "i" } });

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

  if (valueRequired(createUser)) {
    const userData = await useSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await useSearch(updateUser);
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
  query.select(select);
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, Service, result);

  query.limit(limit);
  query.skip(pagination.start - 1);

  const platform = await query.exec();

  return platform;
};

exports.excelData = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = 25;
  const select = req.query.select;

  // FIELDS
  const status = req.query.status;
  const direct = req.query.direct;
  const name = req.query.name;
  const link = req.query.link;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  let sort = req.query.sort || { createAt: -1 };

  const query = Service.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(direct)) {
    if (direct.split(",").length > 1)
      query.where("direct").in(direct.split(","));
    else query.where("direct").in(direct);
  }

  if (valueRequired(link))
    query.find({ driect: { $regex: ".*" + link + ".*", $options: "i" } });

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

  if (valueRequired(createUser)) {
    const userData = await useSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await useSearch(updateUser);
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
  query.select(select);
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, Service, result);
  const pageCount = pagination.pageCount;
  let datas = [];

  for (let i = 1; i <= pageCount; i++) {
    const res = await getFullData(req, i);
    datas.push(...res);
  }

  res.status(200).json({
    success: true,
    count: datas.length,
    data: datas,
  });
});

exports.getService = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id)
    .populate("createUser")
    .populate("updateUser");

  if (!service) {
    throw new MyError("Тухайн мэдээлэл олдсонгүй. ", 404);
  }

  service.views = service.views + 1;
  service.save();

  res.status(200).json({
    success: true,
    data: service,
  });
});

exports.getSlugService = asyncHandler(async (req, res, next) => {
  const service = await Service.findOne({ slug: req.params.slug })
    .populate("createUser")
    .populate("updateUser");

  if (!service) {
    throw new MyError("Тухайн мэдээлэл олдсонгүй. ", 404);
  }

  service.views = service.views + 1;
  service.save();

  res.status(200).json({
    success: true,
    data: service,
  });
});

exports.deleteService = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const deleteService = await Service.findByIdAndDelete(id);

  if (!deleteService) {
    throw new MyError("Тухайн мэдээлэл олдсонгүй. ", 404);
  }

  deleteService.pictures.map(async (el) => {
    el.pictures && el.pictures.length > 0 && (await imageDelete(el.pictures));
  });

  res.status(200).json({
    success: true,
    data: deleteService,
  });
});

exports.multDeleteService = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findServices = await Service.find({ _id: { $in: ids } });

  if (findServices.length <= 0) {
    throw new MyError("Таны сонгосон сургалтууд олдсонгүй", 400);
  }

  findServices.map((el) => {
    el.pictures.map(async (el) => {
      await imageDelete(el.pictures);
    });
  });

  const service = await Service.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
    data: service,
  });
});

exports.updateService = asyncHandler(async (req, res) => {
  let service = await Service.findById(req.params.id);

  req.body.updateUser = req.userId;
  delete req.body.createUser;

  if (!service) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй", 404);
  }

  if (!valueRequired(req.body.pictures)) {
    req.body.pictures = [];
  }

  const uniqueName = await Service.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length);
  }

  service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: service,
  });
});

exports.getCountService = asyncHandler(async (req, res, next) => {
  const service = await Service.count();
  res.status(200).json({
    success: true,
    data: service,
  });
});
