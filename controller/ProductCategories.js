const ProductCategorires = require("../models/ProductCategories");
const asyncHandler = require("express-async-handler");
const MyError = require("../utils/myError");
const { slugify } = require("transliteration");
const { valueRequired } = require("../lib/check");

exports.createProductCategorires = asyncHandler(async (req, res, next) => {
  const parentId = req.body.parentId || null;

  let position = 0;
  if (parentId) {
    const category = await ProductCategorires.findOne({ parentId }).sort({
      position: -1,
    });
    if (category) {
      position = category.position + 1;
    }
  } else {
    const category = await ProductCategorires.findOne({ parentId: null }).sort({
      position: -1,
    });
    if (category) {
      position = category.position + 1;
    }
  }
  req.body.position = position;

  const uniqueName = await ProductCategorires.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length);
  }

  const category = await ProductCategorires.create(req.body);
  res.status(200).json({
    success: true,
    data: category,
  });
});

function createCategories(categories, parentId = null) {
  const categoryList = [];
  let category = null;

  if (parentId === null) {
    category = categories.filter((cat) => cat.parentId == undefined);
  } else {
    category = categories.filter((cat) => cat.parentId == parentId);
  }

  for (let cate of category) {
    categoryList.push({
      _id: cate._id,
      name: cate.name,
      slug: cate.slug,
      position: cate.position,
      children: createCategories(categories, cate._id),
    });
  }

  return categoryList;
}

exports.getProductCategories = asyncHandler(async (req, res, next) => {
  ProductCategorires.find({})
    .sort({ position: 1 })
    .exec((error, categories) => {
      if (error)
        return res.status(400).json({
          success: false,
          error,
        });
      if (categories) {
        const categoryList = createCategories(categories);

        res.status(200).json({
          success: true,
          data: categoryList,
        });
      }
    });
});

exports.getProductCategory = asyncHandler(async (req, res, next) => {
  const wheelCategorires = await ProductCategorires.findById(req.params.id);

  if (!wheelCategorires) {
    throw new MyError(req.params.id + " Тус мэдээний ангилал олдсонгүй.", 404);
  }

  res.status(200).json({
    success: true,
    data: wheelCategorires,
  });
});

exports.getSlugCategory = asyncHandler(async (req, res, next) => {
  const wheelCategorires = await ProductCategorires.findOne({})
    .where("name")
    .equals(req.params.slug);

  if (!wheelCategorires) {
    throw new MyError(req.params.id + " Тус мэдээний ангилал олдсонгүй.", 404);
  }

  res.status(200).json({
    success: true,
    data: wheelCategorires,
  });
});

const parentCheck = (menus) => {
  menus.map(async (menu) => {
    const result = await ProductCategorires.find({ parentId: menu._id });
    if (result && result.length > 0) {
      parentCheck(result);
    }
    await ProductCategorires.findByIdAndDelete(menu._id);
  });
};

exports.deletetProductCategorires = asyncHandler(async (req, res, next) => {
  const category = await ProductCategorires.findById(req.params.id);
  if (!category) {
    throw new MyError(req.params.id + " ангилал олдсонгүй", 404);
  }
  const parentMenus = await ProductCategorires.find({
    parentId: req.params.id,
  });

  if (parentMenus) {
    parentCheck(parentMenus);
  }

  category.remove();

  res.status(200).json({
    success: true,
    data: category,
  });
});

exports.changePosition = asyncHandler(async (req, res) => {
  menus = req.body.data;

  if (!menus && menus.length > 0) {
    throw new MyError("Дата илгээгүй байна дахин шалгана уу", 404);
  }

  const positionChange = (categories, pKey = null) => {
    if (categories) {
      categories.map(async (el, index) => {
        const data = {
          position: index,
          parentId: pKey,
        };
        await ProductCategorires.findByIdAndUpdate(el.key, data);
        if (el.children && el.children.length > 0) {
          const parentKey = el.key;
          positionChange(el.children, parentKey);
        }
      });
    }
  };

  positionChange(menus);

  res.status(200).json({
    success: true,
  });

  // const info = req.body.info;
  // let parentId = null;
  // let position = dropPosition || 0;

  // const { dragNode, dropPosition, node } = info;

  // const category = await ProductCategorires.findById(dragNode.key);
  // if (!category) {
  //   throw new MyError("Ангилал олдсонгүй.", 404);
  // }

  // const { dragOver, dragOverGapBottom, dragOverGapTop } = node;

  // if (dragOver == true) {
  //   parentId = node.key;
  //   position = dropPosition || 0;
  //   const result = await ProductCategorires.find({ parentId: node.key });
  //   if (result && result.length > 0) {
  //     result.map(async (el) => {
  //       const data = {
  //         position: el.position + 1,
  //       };
  //       await ProductCategorires.findByIdAndUpdate(el._id, data);
  //     });
  //   }
  // }

  // if (dropPosition == -1) {
  //   parentId = null;
  //   position = 0;
  //   const parentMenus = await ProductCategorires.find({ parentId: null });
  //   if (parentMenus && parentMenus.length > 0) {
  //     parentMenus.map(async (menu) => {
  //       const position = menu.position + 1;
  //       const data = {
  //         position,
  //       };
  //       await ProductCategorires.findByIdAndUpdate(menu._id, data);
  //     });
  //   }
  // }

  // if (dragOverGapBottom == true || dragOverGapTop == true || expanded == true) {
  //   const category = await ProductCategorires.findById(node.key);
  //   parentId = category.parentId;

  //   if (dragOverGapBottom == true) {
  //     const bottomNode = await ProductCategorires.findById(node.key);
  //     const result = await ProductCategorires.find({
  //       position: { $gte: bottomNode.position },
  //     })
  //       .where("parentId")
  //       .equals(bottomNode.parentId);

  //     if (result && result.length > 0) {
  //       result.map(async (el) => {
  //         const position = el.position + 1;
  //         const data = {
  //           position,
  //         };
  //         await ProductCategorires.findByIdAndUpdate(el._id, data);
  //       });
  //     }
  //   }
  // }

  // const data = {
  //   position,
  //   parentId,
  // };

  // const updateData = await ProductCategorires.findByIdAndUpdate(dragNode.key, data);
});

exports.updateProductCategorires = asyncHandler(async (req, res, next) => {
  if (!valueRequired(req.body.name)) {
    throw new MyError("Талбарыг бөгөлнө үү", 400);
  }

  const result = await ProductCategorires.findById(req.params.id);

  if (!result) {
    throw new MyError("Өгөгдөл олдсонгүй дахин оролдоно үү", 404);
  }

  const name = req.body.name;

  const nameUnique = await ProductCategorires.find({})
    .where("name")
    .equals(name);

  if (nameUnique.length > 0) {
    req.body.slug =
      nameUnique[nameUnique.length - 1].slug +
      (nameUnique.length + 1).toString();
  } else {
    req.body.slug = slugify(name);
  }

  const category = await ProductCategorires.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!category) {
    throw new MyError("Ангилалын нэр солигдсонгүй", 400);
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});
