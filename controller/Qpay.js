const Qpay = require("../models/Qpay");
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const Invoice = require("../models/Invoice");
const MyError = require("../utils/myError");
const Order = require("../models/Order");
const { valueRequired } = require("../lib/check");
const Tire = require("../models/Tire");
const Wheel = require("../models/Wheel");
const SetProduct = require("../models/SetProduct");
const Product = require("../models/Product");

const getQpayAccess = async () => {
  let data = "";
  const currentDate = new Date().toJSON().slice(0, 10);
  var username = "GOTIRE_MN";
  var password = "4SQSg3kh";
  var auth = "Basic R09USVJFX01OOjRTUVNnM2to=";

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://merchant.qpay.mn/v2/auth/token",
    headers: {
      Authorization: auth,
      Cookie:
        "_4d45d=http://10.233.124.201:3000; qpay_merchant_openapi.sid=s%3AmUH56Dazld8FjQACS7Rf1lXhxo73A51I.nancckzXUKIhdVJd%2B2QB16C818FtUm6FH%2BYXjkq7m9I",
    },
    data: data,
  };

  const lastQpayAccess = await Qpay.findOne({}).sort({ createAt: -1 });

  if (
    !lastQpayAccess ||
    lastQpayAccess.createAt.toJSON().slice(0, 10) < currentDate
  ) {
    axios.request(config).then(async (response) => {
      const result = await Qpay.create(response.data);
      console.log(result);
      return result.access_token;
    });
  } else {
    return lastQpayAccess.access_token;
  }

  //   .request(config)
  //   .then(async (response) => {
  //     const result = await Qpay.create(response.data);
  //     return result;
  //   })
  //   .catch((error) => {
  //     return error;
  //   });
};

exports.createInvoice = asyncHandler(async (req, res) => {
  const accessToken = await getQpayAccess();

  if (!accessToken) {
    throw new MyError("Дахин оролдоно уу");
  }

  const sender_invoice_no = req.body.sender_invoice_no;
  const sender_branch_code = "web";
  const invoice_description = req.body.invoice_description;
  const amount = req.body.amount;

  let data = JSON.stringify({
    invoice_code: "GOTIRE_MN_INVOICE",
    sender_invoice_no: sender_invoice_no,
    invoice_receiver_code: "terminal",
    invoice_description: invoice_description,
    sender_branch_code: sender_branch_code,
    amount: amount,
    callback_url: `${process.env.BASE}payment/call?invoice=${sender_invoice_no}`,
  });

  const invoice = await Invoice.findOne({
    sender_invoice_no: sender_invoice_no,
  });

  const order = await Order.findOne({
    orderNumber: sender_invoice_no,
  });

  if (order) {
    const carts = order.carts;

    const tire = carts.filter((cart) => cart.type === "tire");
    const wheel = carts.filter((cart) => cart.type === "wheel");
    const product = carts.filter((cart) => cart.type === "product");
    const setProduct = carts.filter((cart) => cart.type === "setProduct");

    const tireIds = tire.map((el) => {
      return el.productInfo;
    });

    const wheelIds = wheel.map((el) => {
      return el.productInfo;
    });
    const setProductIds = setProduct.map((el) => {
      return el.productInfo;
    });

    const productIds = product.map((el) => {
      return el.productInfo;
    });

    const resultProduct = await Product.find({
      _id: { $in: productIds },
      status: false,
    });

    if (resultProduct && resultProduct.length > 0) {
      order.status = false;
      order.save();
      throw new MyError(` Сэлбэг зарагдсан байна`, 404);
    }

    const resultTire = await Tire.find({
      _id: { $in: tireIds },
      status: false,
    });

    if (resultTire && resultTire.length > 0) {
      order.status = false;
      order.save();
      throw new MyError(` Дугуй зарагдсан байна`, 404);
    }

    const resultWheel = await Wheel.find({
      _id: { $in: wheelIds },
      status: false,
    });

    if (resultWheel && resultTire.length > 0) {
      order.status = false;
      order.save();
      throw new MyError(` Обуд зарагдсан байна`, 404);
    }

    const resultSetOf = await SetProduct.find({
      _id: { $in: setProductIds },
      status: false,
    });

    if (resultSetOf && resultSetOf.length > 0) {
      order.status = false;
      order.save();
      throw new MyError(`Дугуй обуд зарагдсан байна`, 404);
    }
  }

  if (invoice) {
    res.status(200).json({
      success: true,
      invoice,
    });
    return;
  }

  let config = {
    method: "POST",
    maxBodyLength: Infinity,
    url: "https://merchant.qpay.mn/v2/invoice",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: data,
  };

  const response = await axios.request(config);

  if (response) {
    let invoiceData = {
      invoice_id: response.data.invoice_id,
      qr_text: response.data.qr_text,
      qr_image: response.data.qr_image,
      qPay_shortUrl: response.data.qPay_shortUrl,
      qPay_deeplink: response.data.qPay_deeplink,
      sender_invoice_no: sender_invoice_no,
      invoice_receiver_code: "terminal",
      invoice_description: invoice_description,
      sender_branch_code: sender_branch_code,
      callback_url: `${process.env.BASE}payment/call?invoice=${sender_invoice_no}`,
      amount: amount,
    };

    const invoice = await Invoice.create(invoiceData);

    res.status(200).json({
      success: true,
      data: response.data,
      invoice,
    });
  } else {
    res.status(400).json({
      success: false,
    });
  }
});

exports.getCallBackPayment = asyncHandler(async (req, res) => {
  const invoice = req.query.invoice;
  const result = await Invoice.findOne({ sender_invoice_no: invoice });

  const accessToken = await getQpayAccess();

  if (!accessToken) {
    throw new MyError("Дахин оролдоно уу");
  }

  if (!result) {
    throw new MyError("Нэхэмжлэл үүсээгүй байна", 404);
  }

  let config = {
    method: "POST",
    maxBodyLength: Infinity,
    url: "https://merchant.qpay.mn/v2/payment/check",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: JSON.stringify({
      object_type: "INVOICE",
      object_id: result.invoice_id,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    }),
  };

  const response = await axios.request(config);

  if (!response) {
    throw new MyError("Төлбөр төлөгдөөгүй байна.");
  }

  if (response.data.count == 0) {
    throw new MyError("Төлбөр төлөгдөөгүй байна.");
  }

  if (response.data.rows[0].payment_status !== "PAID") {
    throw new MyError("Төлбөр төлөгдөөгүй байна.");
  }

  if (result.isPaid === true) {
    res.status(200).json({
      success: true,
    });
    return;
  }

  const order = await Order.findOne({ orderNumber: invoice });

  if (order) {
    order.paidType = "qpay";
    order.totalPrice = result.amount;
    order.paid = true;
    order.status = true;
    order.save();
    const carts = order.carts;

    const tire = carts.filter((cart) => cart.type === "tire");
    const wheel = carts.filter((cart) => cart.type === "wheel");
    const product = carts.filter((cart) => cart.type === "product");
    const setProduct = carts.filter((cart) => cart.type === "setProduct");
    let total = 0;

    const tireIds = tire.map((el) => {
      return el.productInfo;
    });

    const wheelIds = wheel.map((el) => {
      return el.productInfo;
    });
    const setProductIds = setProduct.map((el) => {
      return el.productInfo;
    });

    product.map(async (el) => {
      const result = await Product.findById(el.productInfo);
      if (result) {
        if (result.setOf - el.qty == 0) {
          result.status = false;
          result.setOf = result.setOf - el.qty;
        } else if (result.setOf - el.qty < 0) {
          result.setOf = result.setOf;
        } else {
          result.setOf = result.setOf - el.qty;
        }

        result.save();
      }
    });

    await Tire.updateMany(
      { _id: { $in: tireIds } },
      { $set: { status: false } },
      { multi: true }
    );
    await Wheel.updateMany(
      { _id: { $in: wheelIds } },
      { $set: { status: false } },
      { multi: true }
    );

    await SetProduct.updateMany(
      { _id: { $in: setProductIds } },
      { $set: { status: false } },
      { multi: true }
    );
  }

  result.isPaid = true;
  result.save();

  res.status(200).json({
    success: true,
  });
});
