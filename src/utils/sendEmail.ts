import httpStatus from 'http-status';
import nodemailer from 'nodemailer';
import config from '../config';
import ApiError from './apiError';

export const sendEmail = async ({
  to,
  subject,
  html,
  plainText,
}: {
  to: string;
  subject: string;
  html: string;
  plainText?: string;
}) => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.nodemailer.host,
      port: config.nodemailer.port,
      secure: config.nodemailer.secure,
      auth: {
        user: config.nodemailer.user,
        pass: config.nodemailer.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${config.APP_NAME}" <${config.nodemailer.user}>`,
      to: to,
      subject: subject,
      text: plainText,
      html: html,
    });

    if (info.accepted.length === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to send email'
      );
    }

    return info;
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send email'
    );
  }
};
