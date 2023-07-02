const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const User = require("../models/User");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const {
  RegexOptions,
  useServiceSearch,
  useInitCourse,
  userSearch,
} = require("../lib/searchOfterModel");

exports.getInvoices = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // DATA FIELDS
  const isPaid = req.query.isPaid;
  const invoice_id = req.query.invoice_id;
  const sender_invoice_no = req.query.sender_invoice_no;
  const sender_branch_code = req.query.sender_branch_code;
  const course = req.query.course;
  const userId = req.query.userId;
  const invoice_receiver_code = req.query.invoice_receiver_code;
  const invoice_description = req.query.invoice_description;
  const amount = req.query.amount;
  const createAt = req.query.createAt;

  const query = Invoice.find();

  if (valueRequired(isPaid)) {
    if (statuisPaids.split(",").length > 1) {
      query.where("isPaid").in(isPaid.split(","));
    } else query.where("isPaid").equals(isPaid);
  }

  if (valueRequired(invoice_id)) {
    query.find({ invoice_id: RegexOptions(invoice_id) });
  }

  if (valueRequired(sender_invoice_no)) {
    query.find({ sender_invoice_no: RegexOptions(sender_invoice_no) });
  }

  if (valueRequired(sender_branch_code)) {
    query.find({ sender_branch_code: RegexOptions(sender_branch_code) });
  }

  if (valueRequired(course)) {
    const serviceIds = await useInitCourse(course);
    query.where("course").in(serviceIds);
  }

  if (valueRequired(userId)) {
    const userIds = await userSearch(userId);
    query.where("userId").in(userIds);
  }

  if (valueRequired(invoice_receiver_code)) {
    query.find({ invoice_receiver_code: RegexOptions(invoice_receiver_code) });
  }

  if (valueRequired(invoice_description)) {
    query.find({ invoice_description: RegexOptions(invoice_description) });
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

  query.populate("order");
  query.populate("userId");
  query.populate("updateUser");
  query.select(select);

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Invoice, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const invoice = await query.exec();

  res.status(200).json({
    success: true,
    count: invoice.length,
    data: invoice,
    pagination,
  });
});

exports.multDeleteInvoice = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findInvoices = await Invoice.find({ _id: { $in: ids } });

  if (findInvoices.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }

  await Invoice.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id)
    .populate("order")
    .populate("userId")
    .populate("updateUser");

  if (!invoice) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

exports.updateInvoice = asyncHandler(async (req, res, next) => {
  let invoice = await Invoice.findById(req.params.id);

  req.body.updateUser = req.userId;
  req.body.updateAt = new Date.now();

  if (!invoice) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  if (invoice.sender_invoice_no) {
    const order = await Order.findOne({
      orderNumber: invoice.sender_invoice_no,
    });
    if (order) {
      order.paid = true;
      order.save();
    }
  }

  invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

exports.getCountInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.count();
  res.status(200).json({
    success: true,
    data: invoice,
  });
});
