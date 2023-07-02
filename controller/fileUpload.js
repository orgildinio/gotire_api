const MyError = require("../utils/myError");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const { slugify } = require("transliteration");

const upload = (fileData) => {
  return new Promise((resolve, reject) => {
    let fileName, files;
    files = fileData.file;

    files.name = `${slugify(files.name)}`;
    files.mv(`${process.env.FILE_UPLOAD_PATH}/${files.name}`, (error) => {
      if (error) {
        reject("Файлыг хуулах явцад алдаа гарлаа. Алдаа: " + error.message);
      }
      fileName = files.name;
      resolve(fileName);
    });
  });
};

exports.uploadFile = asyncHandler(async (req, res) => {
  const file = req.files;

  await upload(file).then((fileName) => {
    file.name = slugify(fileName);
    res.status(200).json({
      success: true,
      data: slugify(fileName),
    });
  });
});
