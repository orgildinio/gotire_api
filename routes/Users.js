const express = require("express");
const router = express.Router();
const { protect, authorize, protectUser } = require("../middleware/protect");

const {
  register,
  login,
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  logout,
  tokenCheckAlways,
  multDeleteUsers,
  adminControlResetPassword,
  updateCuser,
  getCount,
  loginUser,
  changePassword,
  getUseInfo,
  getUseUpdate,
  phoneCheck,
  emailCheck,
  getFullData,
  getUserPasswordChange,
  getJwt,
  getUserCourses,
} = require("../controller/User");

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/logout").get(protect, logout);
router.route("/checktoken").post(tokenCheckAlways);
router.route("/delete").delete(protect, authorize("admin"), multDeleteUsers);
router.route("/jwt").post(getJwt);
router
  .route("/excel")
  .get(protect, authorize("admin", "operator"), getFullData);
router.route("/loginuser").post(loginUser);

// LOGIN USER

router
  .route("/userdata")
  .get(protect, getUseInfo)
  .put(protect, getUseUpdate)
  .post(protect, getUserPasswordChange);

router
  .route("/admin-reset-password/:id")
  .post(protect, authorize("admin"), adminControlResetPassword);

router
  .route("/")
  .post(protect, authorize("admin"), createUser)
  .get(protect, authorize("admin"), getUsers);
router.route("/count").get(protect, authorize("admin", "operator"), getCount);
router.route("/phone").post(phoneCheck);
router.route("/email").post(emailCheck);
router.route("/coursecheck").get(protect, getUserCourses);

router
  .route("/changepassword")
  .post(protect, authorize("admin"), changePassword);
router.route("/c/:id").put(protect, updateCuser);

router
  .route("/:id")
  .get(protect, authorize("admin"), getUser)
  .put(protect, authorize("admin"), updateUser)
  .delete(protect, authorize("admin"), deleteUser);

module.exports = router;
