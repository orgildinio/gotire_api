const mongoose = require("mongoose");

const WheelCategoriesSchema = new mongoose.Schema(
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

WheelCategoriesSchema.virtual("catCount", {
  ref: "Wheel",
  localField: "_id",
  foreignField: "wheelCategories",
  justOne: false,
  count: true,
});

module.exports = mongoose.model("WheelCategories", WheelCategoriesSchema);
