const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  status: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  orderNumber: {
    type: String,
    trim: true,
  },

  paid: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  paidType: {
    type: String,
    enum: ["qpay", "bankaccount", "none"],
    default: "none",
  },

  carts: [{ type: Object }],

  total: {
    type: Number,
    trim: true,
  },

  firstName: {
    type: String,
    required: [true, "Нэрээ оруулна уу"],
    trim: true,
    minlength: [2, "гарчиг хамгийн багадаа 2 дээш тэмдэгтээс бүтнэ."],
    maxlength: [250, "250 -аас дээш тэмдэгт оруулах боломжгүй"],
  },

  lastName: {
    type: String,
    required: [true, "Овогоо оруулна уу"],
    trim: true,
    minlength: [2, "гарчиг хамгийн багадаа 2 дээш тэмдэгтээс бүтнэ."],
    maxlength: [250, "250 -аас дээш тэмдэгт оруулах боломжгүй"],
  },

  phoneNumber: {
    type: Number,
    required: [true, "Утасны дугаараа оруулна уу"],
    trim: true,
  },

  email: {
    type: String,
    trim: true,
    match: [
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      "Имэйл хаягаа буруу оруулсан байна",
    ],
  },

  address: {
    type: String,
  },

  comment: {
    type: String,
    trim: true,
  },

  increase: {
    type: Boolean,
    default: false,
  },

  delivery: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model("Order", OrderSchema);
