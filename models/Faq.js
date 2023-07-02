const mongoose = require("mongoose");

const FaqSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },

  question: {
    type: String,
    trim: true,
    required: [true, "Асуулт оруулна уу"],
  },

  answer: {
    type: String,
    trim: true,
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

module.exports = mongoose.model("Faq", FaqSchema);
