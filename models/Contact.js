const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Та өөрийн нэрийг заавал оруулах шаардлагатай."],
  },

  email: {
    type: String,
    match: [
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      "Имэйл хаягаа буруу оруулсан байна",
    ],
  },

  phoneNumber: {
    type: Number,
    trim: true,
    required: [true, "Хэрэглэгчинй имэйл хаягийг оруулж өгнө үү"],
  },

  message: {
    type: String,
    required: [true, "Санал хүсэлтээ бичнэ үү"],
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

  updateUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Contact", ContactSchema);
