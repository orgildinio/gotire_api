const mongoose = require("mongoose");

const PayTypeSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: [true, "Банк сонгоно уу"],
  },

  bankAccount: {
    type: Number,
    required: [true, "Дансны дугаараа оруулна уу"],
  },

  accountName: {
    type: String,
    required: [true, "Данс эзэмшигчийн нэр"],
  },
});

module.exports = mongoose.model("PayType", PayTypeSchema);
