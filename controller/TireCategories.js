const TireCategorires = require("../models/TireCategories");
const asyncHandler = require("express-async-handler");
const MyError = require("../utils/myError");
const { slugify } = require("transliteration");
const { valueRequired } = require("../lib/check");

exports.createTireCategorires = asyncHandler(async (req, res, next) => {
  const parentId = req.body.parentId || null;

  let position = 0;
  if (parentId) {
    const category = await TireCategorires.findOne({ parentId }).sort({
      position: -1,
    });
    if (category) {
      position = category.position + 1;
    }
  } else {
    const category = await TireCategorires.findOne({ parentId: null }).sort({
      position: -1,
    });
    if (category) {
      position = category.position + 1;
    }
  }
  req.body.position = position;

  const uniqueName = await TireCategorires.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(req.body.name + "_" + uniqueName.length);
  }

  const category = await TireCategorires.create(req.body);
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
      count: cate.catCount,
      children: createCategories(categories, cate._id),
    });
  }

  return categoryList;
}

exports.getTireCategories = asyncHandler(async (req, res, next) => {
  TireCategorires.find({})
    .sort({ position: 1 })
    .populate("catCount")
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

exports.getTireCategory = asyncHandler(async (req, res, next) => {
  const wheelCategorires = await TireCategorires.findById(req.params.id);

  if (!wheelCategorires) {
    throw new MyError(req.params.id + " Тус мэдээний ангилал олдсонгүй.", 404);
  }

  res.status(200).json({
    success: true,
    data: wheelCategorires,
  });
});

exports.getSlugCategory = asyncHandler(async (req, res, next) => {
  const wheelCategorires = await TireCategorires.findOne({})
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
    const result = await TireCategorires.find({ parentId: menu._id });
    if (result && result.length > 0) {
      parentCheck(result);
    }
    await TireCategorires.findByIdAndDelete(menu._id);
  });
};

exports.deletetTireCategorires = asyncHandler(async (req, res, next) => {
  const category = await TireCategorires.findById(req.params.id);
  if (!category) {
    throw new MyError(req.params.id + " ангилал олдсонгүй", 404);
  }
  const parentMenus = await TireCategorires.find({ parentId: req.params.id });

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
        await TireCategorires.findByIdAndUpdate(el.key, data);
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

  // const category = await TireCategorires.findById(dragNode.key);
  // if (!category) {
  //   throw new MyError("Ангилал олдсонгүй.", 404);
  // }

  // const { dragOver, dragOverGapBottom, dragOverGapTop } = node;

  // if (dragOver == true) {
  //   parentId = node.key;
  //   position = dropPosition || 0;
  //   const result = await TireCategorires.find({ parentId: node.key });
  //   if (result && result.length > 0) {
  //     result.map(async (el) => {
  //       const data = {
  //         position: el.position + 1,
  //       };
  //       await TireCategorires.findByIdAndUpdate(el._id, data);
  //     });
  //   }
  // }

  // if (dropPosition == -1) {
  //   parentId = null;
  //   position = 0;
  //   const parentMenus = await TireCategorires.find({ parentId: null });
  //   if (parentMenus && parentMenus.length > 0) {
  //     parentMenus.map(async (menu) => {
  //       const position = menu.position + 1;
  //       const data = {
  //         position,
  //       };
  //       await TireCategorires.findByIdAndUpdate(menu._id, data);
  //     });
  //   }
  // }

  // if (dragOverGapBottom == true || dragOverGapTop == true || expanded == true) {
  //   const category = await TireCategorires.findById(node.key);
  //   parentId = category.parentId;

  //   if (dragOverGapBottom == true) {
  //     const bottomNode = await TireCategorires.findById(node.key);
  //     const result = await TireCategorires.find({
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
  //         await TireCategorires.findByIdAndUpdate(el._id, data);
  //       });
  //     }
  //   }
  // }

  // const data = {
  //   position,
  //   parentId,
  // };

  // const updateData = await TireCategorires.findByIdAndUpdate(dragNode.key, data);
});

exports.updateTireCategorires = asyncHandler(async (req, res, next) => {
  if (!valueRequired(req.body.name)) {
    throw new MyError("Талбарыг бөгөлнө үү", 400);
  }

  const result = await TireCategorires.findById(req.params.id);

  if (!result) {
    throw new MyError("Өгөгдөл олдсонгүй дахин оролдоно үү", 404);
  }

  const name = req.body.name;

  const nameUnique = await TireCategorires.find({}).where("name").equals(name);

  if (nameUnique.length > 0) {
    req.body.slug =
      nameUnique[nameUnique.length - 1].slug +
      (nameUnique.length + 1).toString();
  } else {
    req.body.slug = slugify(name);
  }

  const category = await TireCategorires.findByIdAndUpdate(
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
