const mongoose = require("mongoose");

const WheelSchema = new mongoose.Schema({
  wheelCode: {
    type: String,
    trim: true,
  },

  status: {
    type: Boolean,
    enum: [true, false],
    default: true,
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

  slug: {
    type: String,
  },

  name: {
    type: String,
    trim: true,
    required: [true, "Обудын гарчиг оруулна уу"],
  },

  diameter: {
    type: Number,
    trim: true,
    required: [true, "Диаметрын хэмжээг оруулна уу"],
  },

  width: {
    type: String,
    trim: true,
    required: [true, "Өргөн JJ оруулна уу"],
  },

  boltPattern: {
    type: String,
    trim: true,
    required: [true, "Болтны хоорондын зайны хэмжээ оруулна уу"],
  },

  inSet: {
    type: String,
    trim: true,
  },

  offSet: {
    type: String,
    trim: true,
  },

  rim: {
    type: String,
    trim: true,
    required: [true, "RIM Хэмжээ оруулна уу"],
  },

  threadSize: {
    type: String,
    trim: true,
  },

  centerBore: {
    type: String,
    trim: true,
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

module.exports = mongoose.model("Wheel", WheelSchema);
