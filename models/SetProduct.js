const mongoose = require("mongoose");

const SetProductSchema = new mongoose.Schema({
  setofCode: {
    type: String,
  },

  code: {
    type: Number,
  },

  isNew: {
    type: Boolean,
    enum: [true, false],
    default: false,
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

  setOf: {
    type: Number,
    default: 0,
  },

  status: {
    type: Boolean,
    enum: [true, false],
    default: true,
  },

  name: {
    type: String,
    trim: true,
    required: [true, "Дугуй үйлдвэрлэгчийн нэрийг оруулна уу"],
  },

  slug: {
    type: String,
  },

  setProductCategories: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "SetProductCategories",
    },
  ],

  tire: {
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

    use: {
      type: Number,
      trim: true,
      required: [true, "Дугуйны ашиглалтын хувийг оруулна уу"],
    },

    season: {
      type: String,
      enum: ["summer", "winter", "allin"],
      required: [true, "Дугуйны улирал оруулна уу"],
    },
  },

  wheel: {
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

module.exports = mongoose.model("SetProduct", SetProductSchema);
