const mongoose = require("mongoose");

const ProductCategoriesSchema = new mongoose.Schema(
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

    picture: {
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

ProductCategoriesSchema.virtual("catCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "productCategories",
  justOne: false,
  match: { status: true },
  count: true,
});

module.exports = mongoose.model("ProductCategories", ProductCategoriesSchema);
