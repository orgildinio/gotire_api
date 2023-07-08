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

  tires: [
    {
      productInfo: {
        type: mongoose.Schema.ObjectId,
        ref: "Tire",
      },
      picture: {
        type: String,
      },
      name: {
        type: String,
      },
      price: {
        type: Number,
      },
    },
  ],

  wheels: [
    {
      productInfo: {
        type: mongoose.Schema.ObjectId,
        ref: "Wheel",
      },
      picture: {
        type: String,
      },
      name: {
        type: String,
      },
      price: {
        type: Number,
      },
    },
  ],

  totalPrice: {
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
    unique: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      "Имэйл хаягаа буруу оруулсан байна",
    ],
  },

  userId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
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
