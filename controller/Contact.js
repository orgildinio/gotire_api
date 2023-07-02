const Contact = require("../models/Contact");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { userSearch, RegexOptions } = require("../lib/searchOfterModel");

exports.createContact = asyncHandler(async (req, res, next) => {
  const contact = await Contact.create(req.body);
  res.status(200).json({
    success: true,
    data: contact,
  });
});

exports.getContacts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  const name = req.query.name;
  const email = req.query.email;
  const phoneNumber = req.query.phoneNumber;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Contact.find();

  if (valueRequired(name)) query.find({ name: RegexOptions(name) });
  if (valueRequired(email)) query.find({ email: RegexOptions(email) });
  if (valueRequired(phoneNumber))
    query.find({ phoneNumber: RegexOptions(phoneNumber) });

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

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Contact, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const contact = await query.exec();

  res.status(200).json({
    success: true,
    count: contact.length,
    data: contact,
    pagination,
  });
});

exports.getFullData = asyncHandler(async (req, res, next) => {
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  //  FIELDS
  const name = req.query.name;
  const email = req.query.email;
  const phoneNumber = req.query.phoneNumber;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;

  const query = Contact.find();

  if (valueRequired(name)) query.find({ name: RegexOptions(name) });
  if (valueRequired(email)) query.find({ email: RegexOptions(email) });
  if (valueRequired(phoneNumber))
    query.find({ phoneNumber: RegexOptions(phoneNumber) });

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

  const contacts = await query.exec();

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
});

exports.multDeleteContact = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findContact = await Contact.find({ _id: { $in: ids } });

  if (findContact.length <= 0) {
    throw new MyError("Таны сонгосон өгөгдөл олдсонгүй", 400);
  }

  const contact = await Contact.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getContact = asyncHandler(async (req, res, next) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id);

  if (!contact) {
    throw new MyError("Тухайн өгөгдөл олдсонгүй. ", 404);
  }

  res.status(200).json({
    success: true,
    data: contact,
  });
});

exports.updateContact = asyncHandler(async (req, res, next) => {
  let contact = await Contact.findById(req.params.id);

  if (!contact) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: contact,
  });
});

exports.getCountContact = asyncHandler(async (req, res, next) => {
  const contact = await Contact.count();
  res.status(200).json({
    success: true,
    data: contact,
  });
});
