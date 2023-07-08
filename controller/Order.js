const Order = require("../models/Order");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const User = require("../models/User");
const { valueRequired } = require("../lib/check");
const { RegexOptions, userSearch } = require("../lib/searchOfterModel");
const Tire = require("../models/Tire");
const Wheel = require("../models/Wheel");
const Invoice = require("../models/Invoice");

exports.createOrder = asyncHandler(async (req, res) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;

  if (req.body.userId) {
    const user = await User.findById(req.body.userId);
    req.body.lastName = req.body.lastName || user.lastName;
    req.body.firstName = req.body.firstName || user.firstName;
    req.body.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    req.body.createUser = req.body.userId;
  }

  let totalPrice = 0;
  if (req.body.tires) {
    const tires = req.body.tires;
    tires.map(async (tire) => {
      const result = await Tire.findById(tire.productInfo);
      if (result) {
        totalPrice = totalPrice + result.price;
      }
    });
  }

  if (req.body.wheels) {
    const wheels = req.body.wheels;
    wheels.map(async (wheel) => {
      const result = await Wheel.findById(wheel.productInfo);
      if (result) {
        totalPrice = totalPrice + result.price;
      }
    });
  }

  const d = new Date();
  const year = d.getFullYear() + "";
  let month = d.getMonth() + 1;
  let day = d.getDate();

  if (month <= 9) month = "0" + month;
  else month = month + "";

  if (day <= 9) day = "0" + day;
  else day = day + "";
  let orderNumber = 1;

  const lastOrderNumber = await Order.findOne({}).sort({ createAt: -1 });

  if (lastOrderNumber) {
    orderNumber = parseInt(lastOrderNumber.orderNumber.slice(7)) + 1;
  }

  orderNumber = "O" + year + month + day + orderNumber;

  req.body.orderNumber = orderNumber;

  const order = await Order.create(req.body);
  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.getTodayCount = asyncHandler(async (req, res) => {
  const start = new Date().toDateString();

  const count = await Order.find({
    createdAt: { $gte: start },
  }).count();

  res.status(200).json({
    success: true,
    count,
  });
});

exports.getOrders = asyncHandler(async (req, res) => {
  // Эхлээд query - уудаа аваад хоосон үгүйг шалгаад утга олгох
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // FIELDS
  const status = req.query.status;
  const orderNumber = req.query.orderNumber;
  const paid = req.query.paid;
  const paidType = req.query.paidType;
  const firstName = req.query.firstName;
  const lastName = req.query.lastName;
  const phoneNumber = req.query.phoneNumber;
  const email = req.query.email;
  const userId = req.query.userId;

  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Order.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(paid)) {
    if (paid.split(",").length > 1) {
      query.where("paid").in(paid.split(","));
    } else query.where("paid").equals(paid);
  }

  if (valueRequired(orderNumber)) {
    query.find({ orderNumber: RegexOptions(orderNumber) });
  }

  if (valueRequired(paidType)) {
    query.find({ paidType });
  }

  if (valueRequired(firstName)) {
    query.find({ firstName: RegexOptions(firstName) });
  }

  if (valueRequired(lastName)) {
    query.find({ lastName: RegexOptions(lastName) });
  }

  if (valueRequired(phoneNumber)) {
    query.find({ phoneNumber: RegexOptions(phoneNumber) });
  }

  if (valueRequired(email)) {
    query.find({ email: RegexOptions(email) });
  }

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

  if (valueRequired(userId)) {
    const userData = await userSearch(userId);
    if (userData) {
      query.where("userId").in(userId);
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
  query.populate("wheels.productInfo");
  query.populate("tires.productInfo");
  query.populate("userId");
  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, null, result);
  query.skip(pagination.start - 1);
  query.limit(limit);

  const order = await query.exec();

  res.status(200).json({
    success: true,
    count: order.length,
    data: order,
    pagination,
  });
});

const getFullData = async (req, page) => {
  const limit = 25;
  const select = req.query.select;

  // FIELDS
  const status = req.query.status;
  const orderNumber = req.query.orderNumber;
  const paid = req.query.paid;
  const paidType = req.query.paidType;
  const firstName = req.query.firstName;
  const lastName = req.query.lastName;
  const phoneNumber = req.query.phoneNumber;
  const email = req.query.email;
  const userId = req.query.userId;

  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Order.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(paid)) {
    if (paid.split(",").length > 1) {
      query.where("paid").in(paid.split(","));
    } else query.where("paid").equals(paid);
  }

  if (valueRequired(orderNumber)) {
    query.find({ orderNumber: RegexOptions(orderNumber) });
  }

  if (valueRequired(paidType)) {
    query.find({ paidType });
  }

  if (valueRequired(firstName)) {
    query.find({ firstName: RegexOptions(firstName) });
  }

  if (valueRequired(lastName)) {
    query.find({ lastName: RegexOptions(lastName) });
  }

  if (valueRequired(phoneNumber)) {
    query.find({ phoneNumber: RegexOptions(phoneNumber) });
  }

  if (valueRequired(email)) {
    query.find({ email: RegexOptions(email) });
  }

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

  if (valueRequired(userId)) {
    const userData = await userSearch(userId);
    if (userData) {
      query.where("userId").in(userId);
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

  query.populate("wheels.productInfo");
  query.populate("tires.productInfo");
  query.populate("userId");
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, Order, result);

  query.limit(limit);
  query.skip(pagination.start - 1);

  const order = await query.exec();

  return order;
};

exports.excelData = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = 25;
  const select = req.query.select;

  // FIELDS
  const status = req.query.status;
  const orderNumber = req.query.orderNumber;
  const paid = req.query.paid;
  const paidType = req.query.paidType;
  const firstName = req.query.firstName;
  const lastName = req.query.lastName;
  const phoneNumber = req.query.phoneNumber;
  const email = req.query.email;
  const userId = req.query.userId;

  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Order.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(paid)) {
    if (paid.split(",").length > 1) {
      query.where("paid").in(paid.split(","));
    } else query.where("paid").equals(paid);
  }

  if (valueRequired(orderNumber)) {
    query.find({ orderNumber: RegexOptions(orderNumber) });
  }

  if (valueRequired(paidType)) {
    query.find({ paidType });
  }

  if (valueRequired(firstName)) {
    query.find({ firstName: RegexOptions(firstName) });
  }

  if (valueRequired(lastName)) {
    query.find({ lastName: RegexOptions(lastName) });
  }

  if (valueRequired(phoneNumber)) {
    query.find({ phoneNumber: RegexOptions(phoneNumber) });
  }

  if (valueRequired(email)) {
    query.find({ email: RegexOptions(email) });
  }

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

  if (valueRequired(userId)) {
    const userData = await userSearch(userId);
    if (userData) {
      query.where("userId").in(userId);
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

  query.populate("wheels.productInfo");
  query.populate("tires.productInfo");
  query.populate("userId");
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();
  const pagination = await paginate(page, limit, Order, result);
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

exports.getOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("createUser")
    .populate("updateUser")
    .populate("wheels.productInfo")
    .populate("tires.productInfo")
    .populate("userId");

  if (!order) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const deleteOrder = await Order.findByIdAndDelete(id);

  if (!deleteOrder) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: deleteOrder,
  });
});

exports.multDeleteOrder = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findOrders = await Order.find({ _id: { $in: ids } });

  if (findOrders.length <= 0) {
    throw new MyError("Таны сонгосон өгөгдөлүүд олдсонгүй", 400);
  }

  const order = await Order.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.updateOrder = asyncHandler(async (req, res) => {
  let order = await Order.findById(req.params.id);

  if (!order) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй", 404);
  }

  req.body.updateUser = req.userId;
  delete req.body.createUser;

  if (req.body.paid) {
    const sender_invoice_no = order.orderNumber;
    const data = {
      isPaid: req.body.paid,
    };
    await Invoice.findOneAndUpdate({ sender_invoice_no }, data);
  }

  order = await Order.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.getCountOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.count();
  res.status(200).json({
    success: true,
    data: order,
  });
});
