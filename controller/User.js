const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const MyError = require("../utils/myError");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const paginate = require("../utils/paginate");
const fs = require("fs");
const moment = require("moment");
const { fileUpload, imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const axios = require("axios");
const { findById } = require("../models/User");

// OldUSer Check
exports.oldUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  let data = false;

  if (!email || !password)
    throw new MyError("Имэйл болон нууц үгээ дамжуулна уу", 400);
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 401);
  }

  res.status(200).json({
    success: true,
    data: data,
  });
});

exports.getJwt = asyncHandler(async (req, res, next) => {
  const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCi1mRXMuenSMJV
6xEV5SOEVa4BlMUMOh1li5tmkIOSZHMQUIIf6DmleglXOvAawMaKx5NG6vblo1Qr
BNDXLiBo7YrSzm0bVgCtAnXNaHiRWarh0VyxJMyG75Tro4876E7oZknuN812aqTN
U2InZiEkWUtn8dMitQ2KiT0oGrBQky4zILdZKZaw2yZjisYbeNI+eU6VkBwvqXzR
QfihzctWj4Lu3eiKf7KMOU7Oa61cl7ZqqDP24f4yvPSjsfS8M84T6Vnwv5hz7Dbg
4xUl+hIOsTbRmM1PfP8Ez2j2nQO35vz/VaqaA40fEV7HEsD42nIZ+jpPjOoIX9xQ
0cQqqBTlAgMBAAECggEAFk6sfE2a8o3DIaYMNyWm0fAy4ECTJfOoJ0sSxOAzRhDA
upFs4hYcH5EySmLmlaOnD0f74xE5NYhEdYg5W+ETy4wPIoXo6H/Fo+3cWYFgUvkn
sbvOqO3TnwCfNBC6BIj0ll287wdx/DDr1rz/i0owbBxXeivksrJ+4mWenSna0Y7A
JBlOksooUYk3zmQChLWcnI+ia6xcT9Sw/Dyz3Twoyu/mxBrH5ggSJFHNMCpauUn8
hbaWRPxgycHBsu+cQ0sos+R/xUfNxvSoJrUhMujk/hSZI8sA9+ddQx1/4vkqm7rM
coTJelmNTEaO8156uBME/aVQ0fgSws1Q6ji5UmcoGQKBgQDSd/ZB4iZX4oredBbz
0zLB+488g8T11bKy/wqKqhqa5E+cWkktKtoC0RUjVasFZcGz7X/ipVzlDT9octAA
mqtMpUg1J2MOwYsJbsHNPTzcM0YF4n0xMlyOWByb5zNQ5YQdCnBoTa11yPS08Wrs
h6Em194B/ngT7wbEGRDPrEejpwKBgQDGEI2OCpS/+9XcKb2XEQJyhCXO6PBjw/N1
G5BVcnsvyad4+MrooYQI6YHEbCmQFFs7smPppzcIbu1lRySzF8xBXAEEkmX5c1nY
qbIxRI1PNPb9Xol7S+/9aCDze9nFYzKuTfBD+gPdzLwi9vnytWFMJteLbWYjSlVI
In4S6iWEkwKBgBcLm6NLJ/enjp0dCQZZsc0bxmtR4lcotxBybK0SQyeCqFTubeTM
NGLqke30i21j3vncn4wpnypVcQP2zl/Cj88sqeNoFKig+KBnyEC429kgpCIw0pR4
dzn+2+MWRcAt4XFsmzJQjxW+k0zcwmBz2WlvaZe+TVehbJQ8SmLy8kUxAoGALfq9
wdG3AnKGDRwrhRxPwyHmXQg6dg6RQAhsE0oGSuu3Ux/+is6kBiWfGGg7pdTz8QHS
q/VDk1OdDLvdSy4lHq8rFVKfFa+vldqfIUzWuSKEjAEcTWEtj1hS/fMsdOQ4abpy
InWx3BWhP0SydaOhuLnzo8x7v4mMDrjjJ6TvnL0CgYEAyZ6hSPs2ylhYJvDXAF3+
D8gLkz+T+a1NACBa3V3iZxRO6oNnYJLyeaM3TKE6dzKQvs38AZnYSm4vXzHxlgo/
OcQSXsikSL9OV8DBs4dg11sHOJznV4O3ijnZfjQfbgVddkprvVnbZDlv0vZRUpDg
mcljrmvbuy8H1sxKTY56Rbg=
-----END PRIVATE KEY-----`;
  const payload = {
    sub: "123", // Unique user id string
    name: "Tuvshinbat Bayandelger", // Full name of user

    // Optional custom user root path
    // 'https://claims.tiny.cloud/drive/root': '/johndoe',

    exp: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes expiration
  };

  try {
    const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });
    res.set("content-type", "application/json");
    res.status(200);
    res.send(
      JSON.stringify({
        token: token,
      })
    );
  } catch (e) {
    res.status(500);
    res.send(e.message);
  }
});

// Register
exports.register = asyncHandler(async (req, res, next) => {
  const phoneNumber = req.body.phoneNumber;

  if (valueRequired(req.body.email))
    req.body.email = req.body.email.toLowerCase();

  if (valueRequired(phoneNumber)) {
    const uniquePhoneNumber = await User.find({ phoneNumber });
    if (uniquePhoneNumber.length > 0) {
      throw new MyError("Утасны дугаар бүртгэлтэй байна");
    }
  }

  const user = await User.create(req.body);
  const jwt = user.getJsonWebToken();

  res.status(200).json({
    success: true,
    token: jwt,
    data: user,
  });
});

exports.getFullData = asyncHandler(async (req, res) => {
  let status = req.query.status || null;
  const position = req.query.position;
  const role = req.query.role;
  const lastName = req.query.lastName;
  const firstName = req.query.firstName;
  const username = req.query.username;
  const email = req.query.email;
  const phone = parseInt(req.query.phone) || null;
  const gender = req.query.gender;
  const age = req.query.age;
  const createUser = req.query.createUser;
  const updateUser = req.query.updaetUser;
  const select = req.query.select;

  const page = 1;
  const limit = 25;
  let sort = req.query.sort || { createAt: -1 };

  ["select", "sort", "page", "limit", "status", "name", "role"].forEach(
    (el) => delete req.query[el]
  );

  const query = User.find();
  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(email)) {
    query.find({ email: { $regex: ".*" + email + ".*", $options: "i" } });
  }

  if (valueRequired(lastName)) {
    query.find({ lastName: { $regex: ".*" + lastName + ".*", $options: "i" } });
  }

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

  if (valueRequired(firstName)) {
    query.find({
      firstName: { $regex: ".*" + firstName + ".*", $options: "i" },
    });
  }

  if (valueRequired(username)) {
    query.find({ username: { $regex: ".*" + username + ".*", $options: "i" } });
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
      query.sort(convertSort);
    } else {
      query.sort(sort);
    }
  }

  if (valueRequired(phone)) {
    query.where("phone").equals(phone);
  }

  if (valueRequired(gender)) {
    if (gender.split(",").length > 1) {
      query.where("gender").in(gender.split(","));
    } else query.where("gender").equals(gender);
  }

  if (valueRequired(age)) {
    query.where("age").equals(age);
  }

  if (valueRequired(role)) {
    if (role.split(",").length > 1) {
      query.where("role").in(role.split(","));
    } else query.where("role").equals(role);
  }
  if (valueRequired(position)) {
    query.find({ position: { $regex: ".*" + position + ".*", $options: "i" } });
  }

  if (valueRequired(position)) {
    query.find({ position: { $regex: ".*" + position + ".*", $options: "i" } });
  }

  query.select(select);
  query.sort(sort);
  query.populate("createUser");
  query.populate("updateUser");

  const users = await query.exec();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  let { email, password, phoneNumber } = req.body;
  if (valueRequired(email)) email = email.toLowerCase();
  console.log(req.body);
  // Оролтыгоо шалгана

  if (!email || !password) {
    if (!password || !phoneNumber) {
      throw new MyError(
        "Имэйл эсвэл утасны дугаар болон нууц үгээ оруулна уу",
        400
      );
    }
  }

  // Тухайн хэрэглэгчийг хайна
  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    user = await User.findOne({ phoneNumber }).select("+password");
    if (!user) {
      throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 401);
    }
  }

  const ok = await user.checkPassword(password);

  if (!ok) {
    throw new MyError(
      "Имэйл эсвэл утасны дугаар болон нууц үгээ зөв оруулна уу",
      402
    );
  }

  if (user.status === false) {
    throw new MyError("Уучлаарай таны эрхийг хаасан байна.");
  }

  const token = user.getJsonWebToken();
  req.token = token;
  const cookieOption = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    httpOnly: false,
  };

  res.status(200).cookie("gotiretoken", token, cookieOption).json({
    success: true,
    token,
    user,
  });
});

exports.loginUser = asyncHandler(async (req, res, next) => {
  let { email, password } = req.body;
  email = email.toLowerCase();
  // Оролтыгоо шалгана
  if (!email || !password)
    throw new MyError("Имэйл болон нууц үгээ дамжуулна уу", 400);

  // Тухайн хэрэглэгчийг хайна
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 401);
  }

  // if (user.oldUserLogin === false)
  //   throw new MyError(
  //     "Вэбсайт шинчлэгдсэнтэй холбоотой та нууц үгээ мартсан дээр дарж шинэчлэн үү",
  //     401
  //   );

  const ok = await user.checkPassword(password);

  if (!ok) {
    throw new MyError("Имэйл болон нууц үгээ зөв оруулна уу", 402);
  }

  if (user.status === false) {
    throw new MyError("Уучлаарай таны эрхийг хаасан байна.");
  }

  const token = user.getJsonWebToken();
  req.token = token;
  const cookieOption = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    httpOnly: false,
  };

  res.status(200).cookie("gotiretoken", token, cookieOption).json({
    success: true,
    token,
    user,
  });
});

exports.getUseInfo = asyncHandler(async (req, res, next) => {
  const token = req.cookies.gotiretoken;
  const tokenObject = jwt.verify(token, process.env.JWT_SECRET);

  if (req.userId !== tokenObject.id) {
    throw new MyError(
      ` ${tokenObject.id} Уучлаарай хандах боломжгүй байна.. ${token}`,
      400
    );
  }

  const user = await User.findById(req.userId);

  if (user.status === false)
    throw new MyError("Уучлаарай таны эрхийг хаасан байна..", 400);

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getUserPasswordChange = asyncHandler(async (req, res, next) => {
  const token = req.cookies.gotiretoken;
  const tokenObject = jwt.verify(token, process.env.JWT_SECRET);

  if (req.userId !== tokenObject.id) {
    throw new MyError("Уучлаарай хандах боломжгүй байна..", 401);
  }
  const oldPassword = req.body.oldPassword;
  const password = req.body.password;
  const confPassword = req.body.confPassword;

  const user = await User.findById(req.userId);

  if (!user) {
    throw new MyError("Холболтоо шалгана уу", 401);
  }

  if (password !== confPassword)
    throw new MyError(
      "Уучлаарай давтан оруулсан нууц үг тохирохгүй байна..",
      401
    );

  if (!password) throw new MyError(`Нууц үгээ оруулна уу ${error}`, 401);

  user.password = req.body.password;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getUseUpdate = asyncHandler(async (req, res, next) => {
  const token = req.cookies.gotiretoken;
  const tokenObject = jwt.verify(token, process.env.JWT_SECRET);

  if (req.userId !== tokenObject.id) {
    throw new MyError("Уучлаарай хандах боломжгүй байна..", 400);
  }
  if (req.body.email) req.body.email = req.body.email.toLowerCase();
  req.body.age = parseInt(req.body.age) || 0;
  req.body.phoneNumber = parseInt(req.body.phoneNumber) || null;

  delete req.body.status;
  delete req.body.role;
  delete req.body.password;
  delete req.body.confirmPassword;

  // if (valueRequired(req.body.gender) === false) req.body.gender = "other";
  const user = await User.findByIdAndUpdate(req.userId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " Хэрэглэгч олдсонгүй.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.tokenCheckAlways = asyncHandler(async (req, res, next) => {
  const token = req.cookies.gotiretoken;

  if (!token) {
    throw new MyError("Уучлаарай хандах боломжгүй байна..", 400);
  }

  const tokenObject = jwt.verify(token, process.env.JWT_SECRET);

  req.userId = tokenObject.id;
  req.userRole = tokenObject.role;

  const user = await User.findById(tokenObject.id);

  res.status(200).json({
    success: true,
    role: tokenObject.role,
    userId: tokenObject.id,
    avatar: tokenObject.avatar,
    name: tokenObject.name,
    user,
  });
});

exports.logout = asyncHandler(async (req, res, next) => {
  const cookieOption = {
    expires: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    httpOnly: false,
  };
  res.status(200).cookie("gotiretoken", null, cookieOption).json({
    success: true,
    data: "logout...",
  });
});

exports.emailCheck = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const user = await User.findOne({ status: true })
    .where("email")
    .equals(email);

  if (!user) {
    throw new MyError("Уучлаарай И-мэйлээ шалгаад дахин оролдоно уу");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.phoneCheck = asyncHandler(async (req, res) => {
  const phoneNumber = parseInt(req.body.phoneNumber) || 0;
  const user = await User.findOne({ status: true })
    .where("phoneNumber")
    .equals(phoneNumber);

  if (!user) {
    throw new MyError("Уучлаарай утасны дугаараа шалгаад дахин оролдоно уу");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const newPassword = req.body.password;
  const userId = req.body.id;
  if (!newPassword) {
    throw new MyError("Нууц үгээ дамжуулна уу.", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new MyError(req.body.email + "Хандах боломжгүй.", 400);
  }

  user.password = req.body.password;
  user.resetPassword = undefined;
  user.resetPasswordExpire = undefined;
  user.createAt = Date.now();
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

const useSearch = async (userFirstname) => {
  const userData = await User.find({
    firstName: { $regex: ".*" + userFirstname + ".*", $options: "i" },
  }).select("_id");
  return userData;
};

exports.getUsers = asyncHandler(async (req, res, next) => {
  let status = req.query.status || null;
  const position = req.query.position;
  const role = req.query.role;
  const lastName = req.query.lastName;
  const firstName = req.query.firstName;
  const username = req.query.username;
  const email = req.query.email;
  const phone = parseInt(req.query.phone) || null;
  const gender = req.query.gender;
  const age = req.query.age;
  const createUser = req.query.createUser;
  const updateUser = req.query.updaetUser;
  const select = req.query.select;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };

  ["select", "sort", "page", "limit", "status", "name", "role"].forEach(
    (el) => delete req.query[el]
  );

  const query = User.find();
  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(email)) {
    query.find({ email: { $regex: ".*" + email + ".*", $options: "i" } });
  }

  if (valueRequired(lastName)) {
    query.find({ lastName: { $regex: ".*" + lastName + ".*", $options: "i" } });
  }

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

  if (valueRequired(firstName)) {
    query.find({
      firstName: { $regex: ".*" + firstName + ".*", $options: "i" },
    });
  }

  if (valueRequired(username)) {
    query.find({ username: { $regex: ".*" + username + ".*", $options: "i" } });
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
      query.sort(convertSort);
    } else {
      query.sort(sort);
    }
  }

  if (valueRequired(phone)) {
    query.where("phone").equals(phone);
  }

  if (valueRequired(gender)) {
    if (gender.split(",").length > 1) {
      query.where("gender").in(gender.split(","));
    } else query.where("gender").equals(gender);
  }

  if (valueRequired(age)) {
    query.where("age").equals(age);
  }

  if (valueRequired(role)) {
    if (role.split(",").length > 1) {
      query.where("role").in(role.split(","));
    } else query.where("role").equals(role);
  }

  if (valueRequired(position)) {
    query.find({ position: { $regex: ".*" + position + ".*", $options: "i" } });
  }

  if (valueRequired(position)) {
    query.find({ position: { $regex: ".*" + position + ".*", $options: "i" } });
  }

  query.select(select);
  query.sort(sort);
  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, User, result);
  query.skip(pagination.start - 1);
  query.limit(limit);

  const users = await query.exec();

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
    pagination,
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new MyError("Тухайн хэрэглэгч олдсонгүй.", 404);
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getUserCourses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.query.userId)
    .where("courses")
    .in(req.query.courseId);

  if (!user) {
    throw new MyError("Тухайн хичээлийг худалдаж аваагүй байна.", 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.getCount = asyncHandler(async (req, res, next) => {
  const userCount = await User.count();
  res.status(200).json({
    success: true,
    data: userCount,
  });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  req.body.status = req.body.status || false;
  req.body.role = req.body.role || "user";
  req.body.email = req.body.email.toLowerCase();
  req.body.createUser = req.userId;
  req.body.age = parseInt(req.body.age) || 0;
  req.body.phone = parseInt(req.body.phone) || null;
  req.body.wallet = parseInt(req.body.wallet) || 0;
  const date = moment(Date.now())
    .utcOffset("+0800")
    .format("YYYY-MM-DD HH:mm:ss");

  req.body.createAt = date;

  const file = req.files;

  // if (req.body.role === "admin" && req.userRole !== "admin") {
  //   throw new MyError("Уучлаарай админ эрх өгөх эрхгүй байна", 400);
  // }

  if (file) {
    const avatar = await fileUpload(file.image, "avatar").catch((error) => {
      throw new MyError(`Зураг хуулах явцад алдаа гарлаа: ${error}`, 408);
    });
    req.body.image = avatar.fileName;
  }

  const user = await User.create(req.body);

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  req.body.status = req.body.status || false;
  req.body.role = req.body.role;
  req.body.email = req.body.email && req.body.email.toLowerCase();
  req.body.updateUser = req.userId;
  req.body.age = parseInt(req.body.age) || 0;
  req.body.phone = parseInt(req.body.phone) || null;
  req.body.wallet = parseInt(req.body.wallet) || 0;
  if (valueRequired(req.body.gender) === false) req.body.gender = "other";

  delete req.body.password;
  delete req.body.confirmPassword;

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй Хэрэглэгч байхгүйээээ.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.updateCuser = asyncHandler(async (req, res, next) => {
  req.body.status = req.body.status || false;
  req.body.role = req.body.role || "user";
  req.body.email = req.body.email.toLowerCase();
  req.body.updateUser = req.userId;

  if (req.params.id !== req.userId) {
    throw new MyError("Уучлаарай хандах боломжгүй", 300);
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй Хэрэглэгч байхгүйээээ.", 400);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.params.id + " ID-тэй хэрэглэгч байхгүйээээ.", 400);
  }

  user.image && imageDelete(user.image);

  user.remove();

  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.multDeleteUsers = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findUsers = await User.find({ _id: { $in: ids } });
  // throw new MyError("Зүгээр алдаа гаргамаар байна. ", 404);
  if (findUsers.length <= 0) {
    throw new MyError("Таны сонгосон хэрэглэгчид олдсонгүй", 404);
  }

  findUsers.map(async (el) => {
    el.image && (await imageDelete(el.image));
  });

  const user = await User.deleteMany({ _id: { $in: ids } });
  res.status(200).json({
    success: true,
    data: user,
  });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.phoneNumber) {
    throw new MyError(" Утасны дугаараа оруулна уу.", 400);
  }

  const user = await User.findOne({ phoneNumber: req.body.phoneNumber });

  if (!user) {
    throw new MyError(" Утасны дугаараа шалгана уу.", 400);
  }

  const resetToken = user.generatePasswordChangeToken();

  // await user.save();
  await user.save({ validateBeforeSave: false });

  const message = `Энэ таны баталгаажуулах код ${resetToken}`;

  // Имэйл илгээнэ
  // const info = await sendEmail({
  //   email: user.email,
  //   subject: "Нууц үг сэргээх хүсэлт",
  //   message,
  // });

  await fetch(
    `https://api.messagepro.mn/send?from=72779955&to=${user.phoneNumber}&text=${message}&key=346de67656a4fa0be6136047a9d91d16`
  );

  res.status(200).json({
    success: true,
    resetToken,
    console: message,
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.otp || !req.body.password) {
    throw new MyError(
      "Баталгаажуулах код болон шинэ нууц үгээ оруулна уу.",
      400
    );
  }

  const user = await User.findOne({
    resetPasswordToken: req.body.otp,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new MyError(
      req.body.email + "Баталгаажуулах код хүчингүй байна дахин авна уу.",
      400
    );
  }

  user.password = req.body.password;
  user.phoneNumber = req.body.phoneNumber;
  user.oldUserLogin = true;
  user.resetPassword = undefined;
  user.resetPasswordExpire = undefined;

  user.save();

  const token = user.getJsonWebToken();
  res.status(200).json({
    success: true,
    token,
    user,
  });
});

exports.adminControlResetPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.password) {
    throw new MyError("нууц үгээ дамжуулна уу.", 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new MyError(req.body.email + "Токен хүчингүй байна.", 400);
  }

  user.password = req.body.password;
  user.resetPassword = undefined;
  user.resetPasswordExpire = undefined;
  user.updateAt = Date.now();
  user.updateUser = req.userId;
  await user.save();

  res.status(200).json({
    success: true,
    user,
  });
});

// FILE UPLOAD

const deleteImage = (filePaths) => {
  if (filePaths) {
    const filePath = filePaths;
    try {
      fs.unlinkSync(process.env.FILE_AVATAR_UPLOAD_PATH + "/" + filePath);
      fs.unlinkSync(
        process.env.FILE_AVATAR_UPLOAD_PATH + "/150x150/" + filePath
      );
      fs.unlinkSync(
        process.env.FILE_AVATAR_UPLOAD_PATH + "/350x350/" + filePath
      );
      fs.unlinkSync(process.env.FILE_AVATAR_UPLOAD_PATH + "/450/" + filePath);
    } catch (error) {
      console.log(error);
    }
  }
};
