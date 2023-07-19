const mongoose = require("mongoose");

const TireSchema = new mongoose.Schema({
  tireCode: {
    type: String,
  },

  code: {
    type: Number,
  },

  star: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  isDiscount: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  status: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },

  slug: {
    type: String,
  },

  name: {
    type: String,
    trim: true,
    required: [true, "Дугуй үйлдвэрлэгчийн нэрийг оруулна уу"],
  },

  tireCategories: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "TireCategories",
    },
  ],

  make: {
    type: mongoose.Schema.ObjectId,
    ref: "TireMake",
  },

  modal: {
    type: mongoose.Schema.ObjectId,
    ref: "TireModal",
  },

  width: {
    type: Number,
    trim: true,
    required: [true, "өргөн оруулна уу"],
  },

  height: {
    type: Number,
    trim: true,
    required: [true, "Хажуугийн талын хэмжээг оруулна уу"],
  },

  diameter: {
    type: Number,
    trim: true,
    required: [true, "Диаметрын хэмжээг оруулна уу"],
  },

  year: {
    type: Number,
    trim: true,
  },

  use: {
    type: Number,
    trim: true,
    required: [true, "Дугуйны ашиглалтын хувийг оруулна уу"],
  },

  season: {
    type: String,
    enum: ["summer", "winter", "allin"],
    required: [true, "Дугуйны улилралыг оруулна уу"],
  },

  price: {
    type: Number,
    trim: true,
    required: [true, "Дугуйны үнэ оруулна уу"],
  },

  discount: {
    type: Number,
    trim: true,
    default: 0,
  },

  setOf: {
    type: Number,
    trim: true,
    default: 1,
  },

  details: {
    type: String,
    trim: true,
  },

  pictures: {
    type: [String],
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

module.exports = mongoose.model("Tire", TireSchema);
