const mongoose = require("mongoose");
const { slugify } = require("transliteration");

const PageSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  mainLink: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  newsActive: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  listActive: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  pageActive: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  pageParentActive: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  modalActive: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  choiseModal: {
    type: String,
  },

  modal: {
    type: String,
  },

  name: {
    type: String,
    required: [true, "Хуудасны нэрийг оруулна уу"],
  },

  slug: {
    type: String,
  },

  pageInfo: {
    type: String,
    required: [true, "Хуудасны дэлгэрэнгүй мэдээллийг оруулна уу"],
  },

  menu: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Menu",
    },
  ],

  footerMenu: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "FooterMenu",
    },
  ],

  categories: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "NewsCategories",
    },
  ],

  pictures: {
    type: [String],
  },

  page: {
    type: mongoose.Schema.ObjectId,
    ref: "Page",
  },

  views: {
    type: Number,
    default: 0,
  },

  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
  createUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  updateUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Page", PageSchema);
