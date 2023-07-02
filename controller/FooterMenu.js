const FooterMenu = require("../models/FooterMenu");
const asyncHandler = require("express-async-handler");
const MyError = require("../utils/myError");

exports.createFooterMenu = asyncHandler(async (req, res) => {
  const parentId = req.body.parentId || null;
  let position = 0;
  if (parentId) {
    const category = await FooterMenu.findOne({ parentId }).sort({
      position: -1,
    });
    if (category) {
      position = category.position + 1;
    }
  } else {
    const category = await FooterMenu.findOne({ parentId: null }).sort({
      position: -1,
    });
    if (category) {
      position = category.position + 1;
    }
  }
  req.body.position = position;

  const category = await FooterMenu.create(req.body);
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

exports.getFooterMenus = asyncHandler(async (req, res, next) => {
  FooterMenu.find({})
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

exports.getFooterMenu = asyncHandler(async (req, res, next) => {
  const footerFooterMenu = await FooterMenu.findById(req.params.id);

  if (!footerFooterMenu) {
    throw new MyError(req.params.id + " Тус мэдээний ангилал олдсонгүй.", 404);
  }

  res.status(200).json({
    success: true,
    data: footerFooterMenu,
  });
});

const parentCheck = (footerFooterMenus) => {
  footerFooterMenus.map(async (footerFooterMenu) => {
    const result = await FooterMenu.find({ parentId: footerFooterMenu._id });
    if (result && result.length > 0) {
      parentCheck(result);
    }
    await FooterMenu.findByIdAndDelete(footerFooterMenu._id);
  });
};

exports.deletetFooterMenu = asyncHandler(async (req, res, next) => {
  const category = await FooterMenu.findById(req.params.id);
  if (!category) {
    throw new MyError(req.params.id + " ангилал олдсонгүй", 404);
  }
  const parentFooterMenus = await FooterMenu.find({ parentId: req.params.id });

  if (parentFooterMenus) {
    parentCheck(parentFooterMenus);
  }

  category.remove();

  res.status(200).json({
    success: true,
    data: category,
  });
});

exports.changePosition = asyncHandler(async (req, res) => {
  const footerFooterMenus = req.body.data;

  if (!footerFooterMenus && footerFooterMenus.length > 0) {
    throw new MyError("Дата илгээгүй байна дахин шалгана уу", 404);
  }

  const positionChange = (categories, pKey = null) => {
    if (categories) {
      categories.map(async (el, index) => {
        const data = {
          position: index,
          parentId: pKey,
        };
        await FooterMenu.findByIdAndUpdate(el.key, data);
        if (el.children && el.children.length > 0) {
          const parentKey = el.key;
          positionChange(el.children, parentKey);
        }
      });
    }
  };

  positionChange(footerFooterMenus);

  res.status(200).json({
    success: true,
  });

  // const info = req.body.info;
  // let parentId = null;
  // let position = dropPosition || 0;

  // const { dragNode, dropPosition, node } = info;

  // const category = await FooterMenu.findById(dragNode.key);
  // if (!category) {
  //   throw new MyError("Ангилал олдсонгүй.", 404);
  // }

  // const { dragOver, dragOverGapBottom, dragOverGapTop } = node;

  // if (dragOver == true) {
  //   parentId = node.key;
  //   position = dropPosition || 0;
  //   const result = await FooterMenu.find({ parentId: node.key });
  //   if (result && result.length > 0) {
  //     result.map(async (el) => {
  //       const data = {
  //         position: el.position + 1,
  //       };
  //       await FooterMenu.findByIdAndUpdate(el._id, data);
  //     });
  //   }
  // }

  // if (dropPosition == -1) {
  //   parentId = null;
  //   position = 0;
  //   const parentFooterMenus = await FooterMenu.find({ parentId: null });
  //   if (parentFooterMenus && parentFooterMenus.length > 0) {
  //     parentFooterMenus.map(async (footerFooterMenu) => {
  //       const position = footerFooterMenu.position + 1;
  //       const data = {
  //         position,
  //       };
  //       await FooterMenu.findByIdAndUpdate(footerFooterMenu._id, data);
  //     });
  //   }
  // }

  // if (dragOverGapBottom == true || dragOverGapTop == true || expanded == true) {
  //   const category = await FooterMenu.findById(node.key);
  //   parentId = category.parentId;

  //   if (dragOverGapBottom == true) {
  //     const bottomNode = await FooterMenu.findById(node.key);
  //     const result = await FooterMenu.find({
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
  //         await FooterMenu.findByIdAndUpdate(el._id, data);
  //       });
  //     }
  //   }
  // }

  // const data = {
  //   position,
  //   parentId,
  // };

  // const updateData = await FooterMenu.findByIdAndUpdate(dragNode.key, data);
});

exports.updateFooterMenu = asyncHandler(async (req, res, next) => {
  const category = await FooterMenu.findByIdAndUpdate(req.params.id, req.body, {
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
