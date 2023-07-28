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
const Product = require("../models/Product");
const SetProduct = require("../models/SetProduct");
const moment = require("moment");

exports.cartCheck = asyncHandler(async (req, res) => {
  const carts = req.body.carts;

  const tire = carts.filter((cart) => cart.type === "tire");
  const wheel = carts.filter((cart) => cart.type === "wheel");
  const product = carts.filter((cart) => cart.type === "product");
  const setProduct = carts.filter((cart) => cart.type === "setProduct");
  let total = 0;

  const tireIds = tire.map((el) => {
    if (el.isDiscount === false) {
      total += parseInt(el.price);
    } else if (el.isDiscount === true) {
      total += parseInt(el.discount);
    }

    return el.productInfo;
  });

  const wheelIds = wheel.map((el) => {
    if (el.isDiscount === false) {
      total += parseInt(el.price);
    } else if (el.isDiscount === true) {
      total += parseInt(el.discount);
    }
    return el.productInfo;
  });

  const productIds = product.map((el) => {
    if (el.isDiscount === false) {
      total += parseInt(el.qty) * parseInt(el.price);
    } else if (el.isDiscount === true) {
      total += parseInt(el.qty) * parseInt(el.discount);
    }
    return el.productInfo;
  });

  const setProductIds = setProduct.map((el) => {
    if (el.isDiscount === false) {
      total += parseInt(el.qty) * parseInt(el.price);
    } else if (el.isDiscount === true) {
      total += parseInt(el.qty) * parseInt(el.discount);
    }
    return el.productInfo;
  });

  const tires = await Tire.find({ _id: { $in: tireIds } });
  const wheels = await Wheel.find({ _id: { $in: wheelIds } });
  const products = await Product.find({ _id: { $in: productIds } });
  const setProducts = await SetProduct.find({ _id: { $in: setProductIds } });

  products.map((d, index) => {
    const test = product.filter((el) => el.code === d.productCode);
    if (test && test.length > 0) {
      if (test[0]["qty"] <= d.setOf) {
        products[index].qty = test[0]["qty"];
      } else if (test[0]["qty"] > d.setOf) {
        products[index].qty = d.setOf;
      }
    }
  });

  res.status(200).json({
    success: true,
    tires,
    wheels,
    products,
    setProducts,
    total,
    prd: product,
    carts,
  });
});

exports.createOrder = asyncHandler(async (req, res) => {
  req.body.createUser = req.userId;
  req.body.status = (valueRequired(req.body.status) && req.body.status) || true;
  const carts = req.body.carts;

  const tire = carts.filter((cart) => cart.type === "tire");
  const wheel = carts.filter((cart) => cart.type === "wheel");
  const product = carts.filter((cart) => cart.type === "product");
  const setProduct = carts.filter((cart) => cart.type === "setProduct");
  let total = 0;

  const tireIds = tire.map((el) => {
    if (el.isDiscount === false) {
      total += parseInt(el.price);
    } else if (el.isDiscount === true) {
      total += parseInt(el.discount);
    }

    if (el.status === false) {
      throw new MyError(`Таны сонгосон ${el.name} дугуй дууссан байна`);
    }

    return el.productInfo;
  });

  const wheelIds = wheel.map((el) => {
    if (el.isDiscount === false) {
      total += parseInt(el.price);
    } else if (el.isDiscount === true) {
      total += parseInt(el.discount);
    }
    if (el.status === false) {
      throw new MyError(`Таны сонгосон ${el.name} обуд дууссан байна`);
    }

    return el.productInfo;
  });

  const productIds = product.map((el) => {
    if (el.isDiscount === false) {
      total += parseInt(el.qty) * parseInt(el.price);
    } else if (el.isDiscount === true) {
      total += parseInt(el.qty) * parseInt(el.discount);
    }

    if (el.status === false) {
      throw new MyError(`Таны сонгосон ${el.name} сэлбэг дууссан байна`);
    }

    return el.productInfo;
  });

  const setProductIds = setProduct.map((el) => {
    if (el.isDiscount === false) {
      total += parseInt(el.qty) * parseInt(el.price);
    } else if (el.isDiscount === true) {
      total += parseInt(el.qty) * parseInt(el.discount);
    }

    if (el.status === false) {
      throw new MyError(`Таны сонгосон ${el.name} дугуй, обуд дууссан байна`);
    }

    return el.productInfo;
  });

  const tires = await Tire.find({ _id: { $in: tireIds } });
  const wheels = await Wheel.find({ _id: { $in: wheelIds } });
  const products = await Product.find({ _id: { $in: productIds } });
  const setProducts = await SetProduct.find({ _id: { $in: setProductIds } });

  products.map((d, index) => {
    const test = product.filter((el) => el.code === d.productCode);
    if (test && test.length > 0) {
      if (test[0]["qty"] <= d.setOf) {
        products[index].qty = test[0]["qty"];
      } else if (test[0]["qty"] > d.setOf) {
        throw new MyError("Сэлбэгний үлдэгдэл хүрэлцэхгүй байна");
      }
    }
  });

  const user = await User.findById(req.userId);
  req.body.lastName = req.body.lastName || user.lastName;
  req.body.firstName = req.body.firstName || user.firstName;
  req.body.phoneNumber = req.body.phoneNumber || user.phoneNumber;

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
    if (
      lastOrderNumber.orderNumber.slice(0, 7) ==
      "O" + year.slice(2) + month + day
    ) {
      orderNumber = parseInt(lastOrderNumber.orderNumber.slice(7)) + 1;
    }
  }

  orderNumber = "O" + year.slice(2) + month + day + orderNumber;
  req.body.total = total;
  req.body.orderNumber = orderNumber;

  const order = await Order.create(req.body);
  res.status(200).json({
    success: true,
    data: order,
    products,
    setProducts,
    tires,
    wheels,
    total,
  });
});

exports.updateUserOrder = asyncHandler(async (req, res) => {
  const result = await Order.findByIdAndUpdate(req.params.id, {
    status: false,
  });
  res.status(200).json({
    success: true,
    data: result,
  });
});

exports.getTodayCount = asyncHandler(async (req, res) => {
  const start = new Date().toDateString();

  const today = moment().startOf("day");
  const current = new Date().toJSON().slice(0, 10);
  console.log(current);
  const count = await Order.find({
    $where: `this.createAt.toJSON().slice(0, 10) === "${current}"`,
  }).count();

  res.status(200).json({
    success: true,
    count,
  });
});

exports.getUserOrders = asyncHandler(async (req, res) => {
  // Эхлээд query - уудаа аваад хоосон үгүйг шалгаад утга олгох
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;

  if (req.userId) {
    const user = await User.findById(req.userId);

    if (!user) {
      throw new MyError("Хандах боломжгүй байна", 404);
    }
  } else {
    throw new MyError("Нэвтэрч орно уу", 400);
  }

  // FIELDS
  const query = Order.find({ createUser: req.userId }).sort({
    createAt: -1,
  });

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

exports.getUserOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("createUser")
    .populate("updateUser");

  if (!order) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.getOrders = asyncHandler(async (req, res) => {
  // Эхлээд query - уудаа аваад хоосон үгүйг шалгаад утга олгох
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // FIELDS
  const userInputs = req.query;
  const arrayBooleanFields = ["status", "paid", "increase", "delivery"];
  const arrayIntFields = ["total", "phoneNumber"];
  const arrayStringFields = ["firstName", "lastName", "email", "address"];
  const orderNumber = req.query.orderNumber;
  const paidType = req.query.paidType;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Order.find();

  arrayBooleanFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.where(field).in(userInputs[field].split(","));
    }
  });

  arrayStringFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.find({ field: RegexOptions(userInputs[field]) });
    }
  });

  arrayIntFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.find({ field: RegexOptions(parseInt(userInputs[field])) });
    }
  });

  if (valueRequired(orderNumber)) {
    query.find({ orderNumber: RegexOptions(orderNumber) });
  }

  if (valueRequired(paidType)) {
    const arrayList = paidType.split(",");
    query.where("paidType").in(arrayList);
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

  query.select(select);
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
  const userInputs = req.query;
  const arrayBooleanFields = ["status", "paid", "increase", "delivery"];
  const arrayIntFields = ["total", "phoneNumber"];
  const arrayStringFields = ["firstName", "lastName", "email", "address"];
  const paidType = req.query.paidType;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Order.find();

  arrayBooleanFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.where(field).in(userInputs[field].split(","));
    }
  });

  arrayStringFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.find({ field: RegexOptions(userInputs[field]) });
    }
  });

  arrayIntFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.find({ field: RegexOptions(parseInt(userInputs[field])) });
    }
  });

  if (valueRequired(orderNumber)) {
    query.find({ orderNumber: RegexOptions(orderNumber) });
  }

  if (valueRequired(paidType)) {
    const arrayList = paidType.split(",");
    query.where("paidType").in(arrayList);
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
  query.populate("createUser");
  query.populate("updateUser");

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
  const userInputs = req.query;
  const arrayBooleanFields = ["status", "paid", "increase", "delivery"];
  const arrayIntFields = ["total", "phoneNumber"];
  const arrayStringFields = ["firstName", "lastName", "email", "address"];
  const paidType = req.query.paidType;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Order.find();

  arrayBooleanFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.where(field).in(userInputs[field].split(","));
    }
  });

  arrayStringFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.find({ field: RegexOptions(userInputs[field]) });
    }
  });

  arrayIntFields.map((field) => {
    if (valueRequired(userInputs[field])) {
      query.find({ field: RegexOptions(parseInt(userInputs[field])) });
    }
  });

  if (valueRequired(orderNumber)) {
    query.find({ orderNumber: RegexOptions(orderNumber) });
  }

  if (valueRequired(paidType)) {
    const arrayList = paidType.split(",");
    query.where("paidType").in(arrayList);
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
  query.populate("createUser");
  query.populate("updateUser");

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
    .populate("updateUser");

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
