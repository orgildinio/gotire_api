const Menu = require("../models/Menu");
const asyncHandler = require("express-async-handler");
const MyError = require("../utils/myError");
const { slugify } = require("transliteration");
const { valueRequired } = require("../lib/check");

exports.createMenu = asyncHandler(async (req, res, next) => {
  const parentId = req.body.parentId || null;
  const name = req.body.name;
  let position = 0;
  if (parentId) {
    const category = await Menu.findOne({ parentId }).sort({
      position: -1,
    });
    if (category) {
      position = category.position + 1;
    }
  } else {
    const category = await Menu.findOne({ parentId: null }).sort({
      position: -1,
    });
    if (category) {
      position = category.position + 1;
    }
  }
  req.body.position = position;

  const nameUnique = await Menu.find({}).where("name").equals(name);
  if (nameUnique.length > 0) {
    req.body.slug =
      nameUnique[nameUnique.length - 1].slug +
      (nameUnique.length + 1).toString();
  }

  const category = await Menu.create(req.body);
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
      isModel: cate.isModel,
      isDirect: cate.isDirect,
      direct: cate.direct,
      model: cate.model,
      picture: cate.picture || null,
      position: cate.position,
      children: createCategories(categories, cate._id),
    });
  }

  return categoryList;
}

exports.getMenus = asyncHandler(async (req, res, next) => {
  Menu.find({})
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

exports.getMenu = asyncHandler(async (req, res, next) => {
  let menu = "";
  if (req.query && req.query.direct) {
    menu = await Menu.findOne({ direct: `/${req.query.direct}` });
  } else {
    menu = await Menu.findById(req.params.id);
  }

  if (!menu) {
    throw new MyError(" Тус мэдээний ангилал олдсонгүй.", 404);
  }

  res.status(200).json({
    success: true,
    data: menu,
  });
});

const parentCheck = (menus) => {
  menus.map(async (menu) => {
    const result = await Menu.find({ parentId: menu._id });
    if (result && result.length > 0) {
      parentCheck(result);
    }
    await Menu.findByIdAndDelete(menu._id);
  });
};

exports.deletetMenu = asyncHandler(async (req, res, next) => {
  const category = await Menu.findById(req.params.id);
  if (!category) {
    throw new MyError(req.params.id + " ангилал олдсонгүй", 404);
  }
  const parentMenus = await Menu.find({ parentId: req.params.id });

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
  const menus = req.body.data;

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
        await Menu.findByIdAndUpdate(el.key, data);
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

  // const category = await Menu.findById(dragNode.key);
  // if (!category) {
  //   throw new MyError("Ангилал олдсонгүй.", 404);
  // }

  // const { dragOver, dragOverGapBottom, dragOverGapTop } = node;

  // if (dragOver == true) {
  //   parentId = node.key;
  //   position = dropPosition || 0;
  //   const result = await Menu.find({ parentId: node.key });
  //   if (result && result.length > 0) {
  //     result.map(async (el) => {
  //       const data = {
  //         position: el.position + 1,
  //       };
  //       await Menu.findByIdAndUpdate(el._id, data);
  //     });
  //   }
  // }

  // if (dropPosition == -1) {
  //   parentId = null;
  //   position = 0;
  //   const parentMenus = await Menu.find({ parentId: null });
  //   if (parentMenus && parentMenus.length > 0) {
  //     parentMenus.map(async (menu) => {
  //       const position = menu.position + 1;
  //       const data = {
  //         position,
  //       };
  //       await Menu.findByIdAndUpdate(menu._id, data);
  //     });
  //   }
  // }

  // if (dragOverGapBottom == true || dragOverGapTop == true || expanded == true) {
  //   const category = await Menu.findById(node.key);
  //   parentId = category.parentId;

  //   if (dragOverGapBottom == true) {
  //     const bottomNode = await Menu.findById(node.key);
  //     const result = await Menu.find({
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
  //         await Menu.findByIdAndUpdate(el._id, data);
  //       });
  //     }
  //   }
  // }

  // const data = {
  //   position,
  //   parentId,
  // };

  // const updateData = await Menu.findByIdAndUpdate(dragNode.key, data);
});

exports.updateMenu = asyncHandler(async (req, res) => {
  if (!valueRequired(req.body.name)) {
    throw new MyError("Талбарыг бөгөлнө үү", 400);
  }

  if (!valueRequired(req.body.cover)) {
    req.body.cover = "";
  }

  const result = await Menu.findById(req.params.id);

  if (!result) {
    throw new MyError("Өгөгдөл олдсонгүй дахин оролдоно үү", 404);
  }

  const name = req.body.name;

  const nameUnique = await Menu.find({}).where("name").equals(name);

  if (nameUnique.length > 0) {
    req.body.slug =
      nameUnique[nameUnique.length - 1].slug +
      (nameUnique.length + 1).toString();
  } else {
    req.body.slug = slugify(name);
  }

  const category = await Menu.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new MyError("Ангилалын нэр солигдсонгүй", 400);
  }

  res.status(200).json({
    success: true,
    data: category,
  });
});
