const Qpay = require("../models/Qpay");
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const Invoice = require("../models/Invoice");
const MyError = require("../utils/myError");
const Order = require("../models/Order");
const { valueRequired } = require("../lib/check");

const getQpayAccess = () => {
  let data = "";

  var username = "ZAYA_ANANDA";
  var password = "BpQqHffC";
  var auth = "Basic WkFZQV9BTkFOREE6QnBRcUhmZkM=";

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

  axios
    .request(config)
    .then(async (response) => {
      await Qpay.create(response.data);
    })
    .catch((error) => {
      return error;
    });
};

exports.getQpayToken = asyncHandler(async (req, res) => {
  const currentDate = new Date().toJSON().slice(0, 10);
  const lastQpayData = await Qpay.findOne({}).sort({ createAt: -1 });
  if (!lastQpayData) {
    getQpayAccess();
  } else if (lastQpayData.createAt.toJSON().slice(0, 10) < currentDate) {
    getQpayAccess();
  }

  res.status(200).json({
    success: true,
  });
});

exports.createInvoice = asyncHandler(async (req, res) => {
  let sender_invoice_no = req.body.sender_invoice_no;

  if (valueRequired(req.body.sender_branch_code)) {
    if (req.body.sender_branch_code === "course") {
      sender_invoice_no = 1;
      const lastInvoice = await Invoice.findOne({
        sender_branch_code: "course",
      }).sort({ createAt: -1 });

      if (lastInvoice) {
        sender_invoice_no =
          parseInt(lastInvoice.sender_invoice_no.substring(1)) + 1;
      }
      req.body.sender_invoice_no = "C" + sender_invoice_no;
    }
  }

  let data = JSON.stringify({
    invoice_code: "ZAYA_ANANDA_INVOICE",
    sender_invoice_no: req.body.sender_invoice_no,
    invoice_receiver_code: "terminal",
    invoice_description: req.body.invoice_description,
    sender_branch_code: req.body.sender_branch_code,
    amount: req.body.amount,
    callback_url: `${process.env.BASE}payment/call?invoice=${req.body.sender_invoice_no}`,
  });

  const accessToken = await Qpay.findOne({}).sort({ createAt: -1 });
  const currentDate = new Date().toJSON().slice(0, 10);
  if (!accessToken) {
    getQpayAccess();
    throw new MyError("Дахин оролдоно уу");
  }

  if (accessToken.createAt.toJSON().slice(0, 10) < currentDate) {
    getQpayAccess();
    this.createInvoice(req);
  }

  let config = {
    method: "POST",
    maxBodyLength: Infinity,
    url: "https://merchant.qpay.mn/v2/invoice",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken.access_token}`,
    },
    data: data,
  };

  const response = await axios.request(config);

  if (response) {
    let course = null;
    if (valueRequired(req.body.course)) {
      course = req.body.course;
    }

    let invoiceData = {
      invoice_id: response.data.invoice_id,
      sender_invoice_no: req.body.sender_invoice_no,
      invoice_receiver_code: "terminal",
      invoice_description: req.body.invoice_description,
      sender_branch_code: req.body.sender_branch_code,
      amount: req.body.amount,
    };

    if (req.body.sender_branch_code == "course") {
      invoiceData.course = req.body.course;
      invoiceData.userId = req.body.userId;
    }

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
  const accessToken = await Qpay.findOne({}).sort({ createAt: -1 });

  if (!accessToken) {
    getQpayAccess();
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
      Authorization: `Bearer ${accessToken.access_token}`,
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
    throw new MyError("Төлбөр төлөгдсөн байна");
  }

  result.isPaid = true;
  result.save();

  const order = await Order.findOne({ orderNumber: invoice });
  if (order) {
    order.paidType = "qpay";
    order.totalPrice = result.amount;
    order.paid = true;
    order.status = true;
    order.save();
  }

  res.status(200).json({
    success: true,
  });
});
