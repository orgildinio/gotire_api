const Faq = require("../models/Faq");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const { valueRequired } = require("../lib/check");
const { userSearch, RegexOptions } = require("../lib/searchOfterModel");

exports.createFaq = asyncHandler(async (req, res) => {
  req.body.createUser = req.userId;

  const faq = await Faq.create(req.body);
  res.status(200).json({
    success: true,
    data: faq,
  });
});

exports.getFaqs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  const status = req.query.status;
  const question = req.query.question;
  const answer = req.query.answer;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Faq.find();

  if (valueRequired(question)) query.find({ question: RegexOptions(question) });
  if (valueRequired(answer)) query.find({ answer: RegexOptions(answer) });

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(createUser)) {
    const userData = await userSearch(createUser);
    if (userData) query.where("createUser").in(userData);
  }

  if (valueRequired(updateUser)) {
    const userData = await userSearch(updateUser);
    if (userData) query.where("updateUser").in(userData);
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

  const pagination = await paginate(page, limit, Faq, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const faq = await query.exec();

  res.status(200).json({
    success: true,
    count: faq.length,
    data: faq,
    pagination,
  });
});

exports.getFullData = asyncHandler(async (req, res, next) => {
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  const status = req.query.status;
  const question = req.query.question;
  const answer = req.query.answer;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Faq.find();

  if (valueRequired(question)) query.find({ question: RegexOptions(question) });
  if (valueRequired(answer)) query.find({ answer: RegexOptions(answer) });

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(createUser)) {
    const userData = await userSearch(createUser);
    if (userData) query.where("createUser").in(userData);
  }

  if (valueRequired(updateUser)) {
    const userData = await userSearch(updateUser);
    if (userData) query.where("updateUser").in(userData);
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
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const faqs = await query.exec();

  res.status(200).json({
    success: true,
    count: faqs.length,
    data: faqs,
  });
});

exports.multDeleteFaq = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findFaq = await Faq.find({ _id: { $in: ids } });

  if (findFaq.length <= 0) {
    throw new MyError("Таны сонгосон өгөгдөл олдсонгүй", 400);
  }

  const faq = await Faq.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getFaq = asyncHandler(async (req, res, next) => {
  const faq = await Faq.findByIdAndUpdate(req.params.id);

  if (!faq) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: faq,
  });
});

exports.updateFaq = asyncHandler(async (req, res, next) => {
  let faq = await Faq.findById(req.params.id);

  if (!faq) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  faq = await Faq.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: faq,
  });
});

exports.getCountFaq = asyncHandler(async (req, res, next) => {
  const faq = await Faq.count();
  res.status(200).json({
    success: true,
    data: faq,
  });
});
