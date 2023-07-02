const mongoose = require("mongoose");
const { slugify } = require("transliteration");

const PartnerSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },

  slug: String,

  name: {
    type: String,
    trim: true,
    required: [true, "Хамтрагч компанийн нэрийг оруулна уу"],
  },

  link: {
    type: String,
  },

  logo: {
    type: String,
  },

  companyInfo: {
    type: String,
  },

  cover: {
    type: String,
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

PartnerSchema.pre("save", function (next) {
  this.slug = slugify(this.name);
  next();
});

PartnerSchema.pre("update", function (next) {
  this.slug = slugify(this.name);
  this.updateDate = Date.now;
  next();
});

module.exports = mongoose.model("Partner", PartnerSchema);
