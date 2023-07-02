const mongoose = require("mongoose");

const WebInfoSchema = new mongoose.Schema({
  logo: {
    type: String,
  },
  whiteLogo: {
    type: String,
  },
  name: {
    type: String,
  },

  address: {
    type: String,
  },

  siteInfo: {
    type: String,
  },
  policy: {
    type: String,
  },

  phone: {
    type: String,
  },
  email: {
    type: String,
    match: [
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      "Имэйл хаягаа буруу оруулсан байна",
    ],
  },
});

module.exports = mongoose.model("WebInfo", WebInfoSchema);
