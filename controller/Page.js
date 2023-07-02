const Page = require("../models/Page");
const Menu = require("../models/Menu");
const Services = require("../models/Service");
const FooterMenu = require("../models/FooterMenu");
const User = require("../models/User");
const NewsCategories = require("../models/NewsCategories");
const News = require("../models/News");
const MyError = require("../utils/myError");
const asyncHandler = require("express-async-handler");
// const fs = require("fs");
const paginate = require("../utils/paginate");
const { imageDelete } = require("../lib/photoUpload");
const { valueRequired } = require("../lib/check");
const { slugify } = require("transliteration");

exports.createPage = asyncHandler(async (req, res, next) => {
  req.body.createUser = req.userId;
  req.body.status = req.body.status || true;
  req.body.newsActive = req.body.newsActive || false;
  req.body.listActive = req.body.listActive || false;
  const mainLink = req.body.mainLink || false;
  if (valueRequired(req.body.menu) === false || req.body.menu.length <= 0)
    req.body.menu = [];

  if (
    valueRequired(req.body.footerMenu) === false ||
    req.body.footerMenu.length <= 0
  )
    req.body.footerMenu = [];
  if (
    valueRequired(req.body.categories) === false ||
    req.body.categories.length <= 0
  )
    req.body.categories = [];

  if (mainLink === true) {
    const menu = req.body.menu;
    if (valueRequired(menu)) {
      const pages = await Page.find({}).where("menu").in(req.body.menu);
      if (pages.length >= 1) {
        throw new MyError(
          "Өмнө цэсний тохиргоог тухайн цэс дээр идэвхжүүлсэн байна"
        );
      }
    }
    req.body.mainLink = mainLink;
  } else {
    req.body.mainLink = false;
  }

  const uniqueName = await Page.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(uniqueName + "_" + uniqueName.length);
  }

  const page = await Page.create(req.body);

  res.status(200).json({
    success: true,
    data: page,
  });
});

const newsCategorySearch = async (key) => {
  const ids = await NewsCategories.find({
    name: { $regex: ".*" + key + ".*", $options: "i" },
  }).select("_id");
  return ids;
};

const serviceSearch = async (key) => {
  const ids = await Services.find({
    name: { $regex: ".*" + key + ".*", $options: "i" },
  }).select("_id");
  return ids;
};

const menuSearch = async (key) => {
  const ids = await Menu.find({
    name: { $regex: ".*" + key + ".*", $options: "i" },
  }).select("_id");
  return ids;
};

const useSearch = async (userFirstname) => {
  const userData = await User.find({
    firstName: { $regex: ".*" + userFirstname + ".*", $options: "i" },
  }).select("_id");
  return userData;
};

exports.getPages = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.pageNumber) || 1;
  const limit = parseInt(req.query.limit) || 25;
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const newsActive = req.query.newsActive;
  const listActive = req.query.listActive;
  const menu = req.query.menu;
  const footerMenu = req.query.footerMenu;
  const categories = req.query.categories;
  const name = req.query.name;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const modal = req.query.modal;
  const choiseModal = req.query.choiseModal;
  const pageParent = req.query.parent;
  const choisePage = req.query.page;
  const mainLink = req.query.mainLink;
  const query = Page.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(choiseModal)) {
    if (valueRequired(modal)) {
      switch (choiseModal) {
        case "services": {
          const ids = await serviceSearch(modal);
          if (ids) {
            query.where("modal").equals(ids);
          }
          break;
        }
      }
    }
  }
  if (valueRequired(mainLink)) {
    if (mainLink.split(",").length > 1) {
      query.where("mainLink").in(mainLink.split(","));
    } else query.where("mainLink").equals(mainLink);
  }

  if (valueRequired(newsActive)) {
    if (newsActive.split(",").length > 1) {
      query.where("newsActive").in(newsActive.split(","));
    } else query.where("newsActive").equals(newsActive);
  }

  if (valueRequired(choiseModal)) {
    query.where("choiseModal").equals(choiseModal);
  }

  if (valueRequired(pageParent)) {
    query.where("page").in(pageParent);
  }

  if (valueRequired(choisePage)) {
    const pageIds = await Page.find({
      name: { $regex: ".*" + choisePage + ".*", $options: "i" },
    }).select("_id");
    if (pageIds.length > 0) {
      query.where("page").equals(pageIds);
    }
  }

  if (valueRequired(listActive)) {
    if (listActive.split(",").length > 1) {
      query.where("listActive").in(listActive.split(","));
    } else query.where("listActive").equals(listActive);
  }

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

  if (valueRequired(createUser)) {
    const userData = await useSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await useSearch(updateUser);
    if (userData) {
      query.where("updateUser").in(userData);
    }
  }

  if (valueRequired(menu)) {
    const menus = await menuSearch(menu);
    if (menus) {
      query.where("menu").in(menus);
    }
  }

  if (valueRequired(footerMenu)) {
    const footMenus = await menuSearch(footerMenu);
    if (footMenus) {
      query.where("footerMenu").in(footMenus);
    }
  }

  if (valueRequired(categories)) {
    const cats = await newsCategorySearch(categories);
    if (cats) {
      query.where("categories").in(cats);
    }
  }

  if (valueRequired(modal)) {
    query.where("modal").equals(modal);
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      let convertSort = {};
      if (spliteSort[1] === "ascend") {
        convertSort = { [spliteSort[0]]: 1 };
      } else {
        convertSort = { [spliteSort[0]]: -1 };
      }
      if (spliteSort[0] != "undefined") query.sort(convertSort);
    } else {
      query.sort(sort);
    }
  }

  query.populate("categories");
  query.populate("menu");
  query.populate("page");
  query.populate("footerMenu");
  query.select(select);
  query.populate("createUser");
  query.populate("updateUser");

  const qc = query.toConstructor();
  const clonedQuery = new qc();
  const result = await clonedQuery.count();

  const pagination = await paginate(page, limit, Page, result);
  query.limit(limit);
  query.skip(pagination.start - 1);
  const pages = await query.exec();

  res.status(200).json({
    success: true,
    count: pages.length,
    data: pages,
    pagination,
  });
});

exports.getFullData = asyncHandler(async (req, res, next) => {
  let sort = req.query.sort || { createAt: -1 };
  const select = req.query.select;

  // NEWS FIELDS
  const status = req.query.status;
  const newsActive = req.query.newsActive;
  const listActive = req.query.listActive;
  const pageActive = req.query.pageActive;
  const pageParentActive = req.query.pageParentActive;
  const modalActive = req.query.modalActive;

  const menu = req.query.menu;
  const footerMenu = req.query.footerMenu;
  const categories = req.query.categories;
  const modal = req.query.modal;
  const name = req.query.name;
  const createUser = req.query.createUser;
  const updateUser = req.query.updateUser;
  const choiseModal = req.query.choiseModal;
  const mainLink = req.query.mainLink;

  const query = Page.find();

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(mainLink)) {
    if (mainLink.split(",").length > 1) {
      query.where("mainLink").in(mainLink.split(","));
    } else query.where("mainLink").equals(mainLink);
  }

  if (valueRequired(pageActive)) {
    if (pageActive.split(",").length > 1) {
      query.where("pageActive").in(pageActive.split(","));
    } else query.where("pageActive").equals(pageActive);
  }

  if (valueRequired(pageParentActive)) {
    if (pageParentActive.split(",").length > 1) {
      query.where("pageParentActive").in(pageParentActive.split(","));
    } else query.where("pageParentActive").equals(pageParentActive);
  }

  if (valueRequired(modalActive)) {
    if (modalActive.split(",").length > 1) {
      query.where("modalActive").in(modalActive.split(","));
    } else query.where("modalActive").equals(modalActive);
  }

  if (valueRequired(choiseModal)) {
    query.where("choiseModal").equals(choiseModal);
    if (valueRequired(modal)) {
      query.where("modal").equals(modal);
    }
  }

  if (valueRequired(newsActive)) {
    if (newsActive.split(",").length > 1) {
      query.where("newsActive").in(newsActive.split(","));
    } else query.where("newsActive").equals(newsActive);
  }

  if (valueRequired(listActive)) {
    if (listActive.split(",").length > 1) {
      query.where("listActive").in(listActive.split(","));
    } else query.where("listActive").equals(listActive);
  }

  if (valueRequired(status)) {
    if (status.split(",").length > 1) {
      query.where("status").in(status.split(","));
    } else query.where("status").equals(status);
  }

  if (valueRequired(name))
    query.find({ name: { $regex: ".*" + name + ".*", $options: "i" } });

  if (valueRequired(createUser)) {
    const userData = await useSearch(createUser);
    if (userData) {
      query.where("createUser").in(userData);
    }
  }

  if (valueRequired(updateUser)) {
    const userData = await useSearch(updateUser);
    if (userData) {
      query.where("updateUser").in(userData);
    }
  }

  if (valueRequired(menu)) {
    const menus = await menuSearch(menu);
    if (menus) {
      query.where("menu").in(menus);
    }
  }

  if (valueRequired(footerMenu)) {
    const footMenus = await menuSearch(footerMenu);
    if (footMenus) {
      query.where("footerMenu").in(footMenus);
    }
  }

  if (valueRequired(categories)) {
    const cats = await newsCategorySearch(categories);
    if (cats) {
      query.where("categories").in(cats);
    }
  }

  if (valueRequired(sort)) {
    if (typeof sort === "string") {
      const spliteSort = sort.split(":");
      let convertSort = {};
      if (spliteSort[1] === "ascend") {
        convertSort = { [spliteSort[0]]: 1 };
      } else {
        convertSort = { [spliteSort[0]]: -1 };
      }
      if (spliteSort[0] != "undefined") query.sort(convertSort);
    } else {
      query.sort(sort);
    }
  }
  query.populate({ path: "menu", select: "name -_id" });
  query.populate({ path: "footerMenu", select: "name -_id" });
  query.populate({ path: "categories", select: "name -_id" });
  query.populate({ path: "page", select: "name -_id" });
  query.select(select);
  query.populate({ path: "createUser", select: "firstName -_id" });
  query.populate({ path: "updateUser", select: "firstName -_id" });

  const page = await query.exec();

  res.status(200).json({
    success: true,
    count: page.length,
    data: page,
  });
});

exports.multDeletePage = asyncHandler(async (req, res, next) => {
  const ids = req.queryPolluted.id;
  const findPage = await Page.find({ _id: { $in: ids } });

  if (findPage.length <= 0) {
    throw new MyError("Таны сонгосон мэдээнүүд олдсонгүй", 400);
  }
  findPage.map(async (el) => {
    el.pictures && (await imageDelete(el.pictures));
  });

  const news = await Page.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    success: true,
  });
});

exports.getPage = asyncHandler(async (req, res, next) => {
  const page = await Page.findByIdAndUpdate(req.params.id)
    .populate("categories")
    .populate("menu")
    .populate("footerMenu")
    .populate("createUser")
    .populate("updateUser")
    .populate("page");

  // Сонголтуудаас хамаарсан илгээх датануудыг зарлна
  let news = [];
  let childPages = [];
  let menus = [];
  let pages = [];

  if (!page) {
    throw new MyError("Тухайн хуудасны мэдээлэл олдсонгүй. ", 404);
  }

  if (page.mainLink === true) {
    // page active сонгосон байвал сонгосон цэстэй холбогдсон бүх хуудсуудыг илгээнэ
    if (page.pageActive === true) {
      pages = await Page.find({
        $or: [
          { menu: { $in: page.menu } },
          { footerMenu: { $in: page.footerMenu } },
        ],
      }).sort({ createAt: -1 });
    }
    if (page.listActive === true) {
      // Дэд цэсүүдийг олно
      menus = await Menu.find({})
        .where("parentId")
        .in(page.menu)
        .sort({ createAt: -1 });
      const footerMenus = await FooterMenu.find({})
        .where("parentId")
        .in(page.footerMenu)
        .sort({ createAt: -1 });
      if (footerMenus.length > 0) {
        menus = [...menus, ...footerMenus];
      }
    }
  }

  if (page.newsActive === true) {
    news = await News.find({})
      .where("categories")
      .in(page.categories)
      .limit(3)
      .sort({ createAt: -1 });
  }

  if (page.pageParentActive === true) {
    childPages = await Page.find({})
      .where("page")
      .equals(req.params.id)
      .sort({ createAt: -1 });
  }

  // if (page.listActive) {
  //   const menuId =
  //     page.menu && page.menu.length > 0 && page.menu.map((menu) => menu._id);
  //   menus = await Menu.find({})
  //     .where("parentId")
  //     .in(menuId)
  //     .sort({ createAt: -1 });
  // }

  // if (page.pageActive) {
  //   const menuId =
  //     page.menu && page.menu.length > 0 && page.menu.map((menu) => menu._id);
  //   pages = await Page.find({}).where("menu").in(menuId).sort({ createAt: -1 });
  // }

  res.status(200).json({
    success: true,
    data: page,
    news,
    childPages,
    menus,
    pages,
  });
});

exports.updatePage = asyncHandler(async (req, res, next) => {
  let page = await Page.findById(req.params.id);

  if (!page) {
    throw new MyError("Тухайн мэдээ олдсонгүй. ", 404);
  }

  const uniqueName = await Page.find({ name: req.body.name });
  if (uniqueName.length > 0) {
    req.body.slug = slugify(uniqueName + "_" + uniqueName.length);
  }

  if (
    valueRequired(req.body.categories) === false ||
    req.body.categories == "[object Object]"
  ) {
    req.body.categories = [];
  }

  if (
    valueRequired(req.body.footerMenu) === false ||
    req.body.footerMenu == "[object Object]"
  ) {
    req.body.footerMenu = [];
  }

  if (
    valueRequired(req.body.menu) === false ||
    req.body.menu == "[object Object]"
  ) {
    req.body.menu = [];
  } else if (typeof req.body.menu === "string") {
    req.body.menu = [req.body.menu];
  }

  if (valueRequired(req.body.page) === false) {
    delete req.body.page;
  }

  if (!valueRequired(req.body.pictures)) {
    req.body.pictures = [];
  }

  req.body.updateUser = req.userId;
  req.body.updateAt = Date.now();

  page = await Page.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: page,
  });
});

exports.getCountPage = asyncHandler(async (req, res, next) => {
  const count = await Page.count();
  res.status(200).json({
    success: true,
    data: count,
  });
});

exports.getSlugPage = asyncHandler(async (req, res) => {
  let menu = await Menu.findOne({ slug: req.params.slug });
  let menuType = "menu";

  // Тухайн сонгосон мэню хөлны байна уу дээд толгойх байна уу шалгана
  if (!menu) {
    menu = await FooterMenu.findOne({ slug: req.params.slug });
    menuType = "footerMenu";
  }

  if (!menu) {
    throw new MyError("Өгөгдөл олдсонгүй", 404);
  }

  // Дата
  let news = [];
  let pages = [];
  let page = {};
  let menus = [];
  let linkPages = [];
  let parentSameMenus = [];

  page = await Page.findOne({})
    .where(menuType)
    .in(menu._id)
    .where("mainLink")
    .equals(true)
    .sort({ createAt: -1 });

  if (!page) {
    page = await Page.findOne({})
      .where(menuType)
      .in(menu._id)
      .sort({ createAt: -1 });
  }

  if (page && page.mainLink === true) {
    // page active сонгосон байвал сонгосон цэстэй холбогдсон бүх хуудсуудыг илгээнэ
    if (page.pageActive === true) {
      pages = await Page.find({
        $or: [
          { menu: { $in: page.menu } },
          { footerMenu: { $in: page.footerMenu } },
        ],
      }).sort({ createAt: -1 });
    }
    if (page.listActive === true) {
      // Дэд цэсүүдийг олно
      if (menuType === "footerMenu") {
        menus = await FooterMenu.find({})
          .where("parentId")
          .in(page.footerMenu)
          .sort({ createAt: -1 });
      } else {
        menus = await Menu.find({})
          .where("parentId")
          .in(page.menu)
          .sort({ createAt: -1 });
      }
    }
  }

  if (page && page.newsActive === true) {
    news = await News.find({})
      .where("categories")
      .in(page.categories)
      .limit(3)
      .populate("categories")
      .sort({ createAt: -1 });
  }

  if (page && page.pageParentActive === true) {
    linkPages = await Page.find({}).where("page").equals(page._id);
  }

  parentSameMenus = await Menu.find({}).where("parentId").in(menu._id);
  if (parentSameMenus.length <= 0) {
    parentSameMenus = await Menu.find({}).where("parentId").in(menu.parentId);
  }

  res.status(200).json({
    success: true,
    menu,
    page,
    pages,
    linkPages,
    parentSameMenus,
    news,
    menus,
  });
});
