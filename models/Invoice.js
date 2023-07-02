const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  isPaid: {
    type: Boolean,
    enum: [true, false],
    default: false,
  },

  invoice_id: {
    type: String,
  },

  sender_invoice_no: {
    type: String,
    trim: true,
    required: [true, "Нэхэмжлэлийн дугаар оруулна уу"],
  },

  sender_branch_code: {
    type: String,
    enum: ["order"],
    default: "order",
  },

  order: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
  },

  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },

  invoice_receiver_code: {
    type: String,
  },

  invoice_description: {
    type: String,
  },

  amount: {
    type: Number,
  },

  createAt: {
    type: Date,
    default: Date.now,
  },

  updateUser: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },

  updateAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
