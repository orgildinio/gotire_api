const mongoose = require("mongoose");

const WheelSchema = new mongoose.Schema({
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
    required: [true, "Обудын гарчиг оруулна уу"],
  },

  diameter: {
    type: Number,
    trim: true,
    required: [true, "Диаметрын хэмжээг оруулна уу"],
  },

  height: {
    type: Number,
    trim: true,
  },

  boltPattern: {
    type: String,
    trim: true,
    required: [true, "Болтны нүхний зайг оруулна уу"],
  },

  inSet: {
    type: String,
    trim: true,
  },

  offSet: {
    type: String,
    trim: true,
  },

  threadSize: {
    type: String,
    trim: true,
  },

  centerBore: {
    type: mongoose.Decimal128,
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
