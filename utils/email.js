const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const CLIENT_ID =
  "779701740791-jrt4achvh9qibsgteht0k01pqvneremi.apps.googleusercontent.com";
const CLEINT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04ZRcrJlcdlafCgYIARAAGAQSNwF-L9IrDzzty7Ls2CokLf_hIZewTQht-6gP1mEkmecu84zM5MDRRMeBy61LmMvY_aaeobylxcg";
const SMTP_FROM = "Autobiz.mn";
const SMTP_FROM_EMAIL = "autobizotp@gmail.com";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const sendEmail = async (options) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "autobizotp@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLEINT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `${SMTP_FROM} <${SMTP_FROM_EMAIL}>`,
      to: options.email, // list of receivers
      subject: options.subject, // Subject line
      html: options.message, // html body
    };

    const result = await transport.sendMail(mailOptions);

    return result;
  } catch (error) {
    return error;
  }
};

//  // async..await is not allowed in global scope, must use a wrapper
// const sendEmail = async (options) => {
//   // create reusable transporter object using the default SMTP transport
//   let transporter = nodemailer.createTransport({
//     host: SMTP_HOST,
//     port: SMTP_PORT,
//     secure: true, // true for 465, false for other ports
//     auth: {
//       user: SMTP_USERNAME, // generated ethereal user
//       pass: SMTP_PASSWORD, // generated ethereal password
//     },
//   });

//   // send mail with defined transport object
//   let info = await transporter.sendMail({
//     from: `${SMTP_FROM} <${SMTP_FROM_EMAIL}>`, // sender address
//     to: options.email, // list of receivers
//     subject: options.subject, // Subject line
//     html: options.message, // html body
//   });

//   console.log("Message sent: %s", info.messageId);
//   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

//   return info;
// };

module.exports = sendEmail;
