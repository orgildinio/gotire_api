const User = require("../models/User");
const NewsCategories = require("../models/NewsCategories");
const SetProductCategories = require("../models/SetProductCategories");
const TireMake = require("../models/TireMake");
const TireModal = require("../models/TireModal");
const Page = require("../models/Page");
const Menu = require("../models/Menu");
const FooterMenu = require("../models/FooterMenu");
const Service = require("../models/Service");
const TireCategories = require("../models/TireCategories");

exports.useProductCategories = async (name) => {
  const ids = await SetProductCategories.find({
    name: { $regex: ".*" + name + ".*", $options: "i" },
  }).select("_id");
  return ids;
};

exports.userSearch = async (name) => {
  const userData = await User.find({
    firstName: { $regex: ".*" + name + ".*", $options: "i" },
  }).select("_id");
  return userData;
};

exports.useNewsCategorySearch = async (name) => {
  const newsCategories = await NewsCategories.find({
    name: this.RegexOptions(name),
  }).select("_id");
  return newsCategories;
};

exports.useInitCourse = async (name) => {
  const initCourses = await initCourses
    .find({
      name: this.RegexOptions(name),
    })
    .select("_id");
  return initCourses;
};

exports.useServiceSearch = async (name) => {
  const services = await Service.find({ name: this.RegexOptions(name) }).select(
    "_id"
  );

  return services;
};

exports.usePageSearch = async (name) => {
  const pages = await Page.find({
    name: this.RegexOptions(name),
  }).select("_id");
  return pages;
};

exports.useMenuSearch = async (name) => {
  const menus = await Menu.find({
    name: this.RegexOptions(name),
  }).select("_id");

  return menus;
};

exports.useFooterMenuSearch = async (name) => {
  const footerMenus = await FooterMenu.find({
    name: this.RegexOptions(name),
  }).select("_id");

  return footerMenus;
};

exports.useTireCategory = async (name) => {
  const ids = await TireCategories.find({
    name: this.RegexOptions(name),
  }).select("_id");

  return ids;
};

exports.useTireMake = async (name) => {
  const tireMake = await TireMake.find({
    name: this.RegexOptions(name),
  }).select("_id");

  return tireMake;
};

exports.useTireModal = async (name) => {
  const tireModal = await TireModal.find({
    name: this.RegexOptions(name),
  }).select("_id");

  return tireModal;
};

exports.RegexOptions = (name) => {
  const regexNameSearch = { $regex: ".*" + name + ".*", $options: "i" };
  return regexNameSearch;
};
