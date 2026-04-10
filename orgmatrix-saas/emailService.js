const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: `"OrgMatrix System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL_SUCCESS]: Message sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[EMAIL_ERROR]: ${error.message}`);
        throw error;
    }
};

module.exports = { sendEmail };
