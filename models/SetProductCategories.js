const mongoose = require("mongoose");

const SetProductCategoriesSchema = new mongoose.Schema(
  {
    status: {
      type: Boolean,
      enum: [true, false],
      default: true,
    },

    name: {
      type: String,
    },

    slug: {
      type: String,
    },

    parentId: {
      type: String,
    },

    position: {
      type: Number,
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
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SetProductCategoriesSchema.virtual("catCount", {
  ref: "SetProduct",
  localField: "_id",
  foreignField: "setProductCategories",
  justOne: false,
  count: true,
});

module.exports = mongoose.model(
  "SetProductCategories",
  SetProductCategoriesSchema
);
