import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';
import { ResetPasswordPayload } from './auth.interface';

const signInUser = catchAsync(async (req, res) => {
  const result = await AuthService.singInUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Signed in successfully.',
    data: result,
  });
});

const signUpUser = catchAsync(async (req, res) => {
  const result = await AuthService.signUpUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Signed up successfully.',
    data: result,
  });
});

const sendOtp = catchAsync(async (req, res) => {
  const result = await AuthService.sendOtp(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP sent successfully.',
    data: result,
  });
});

const verifyAccount = catchAsync(async (req, res) => {
  const result = await AuthService.verifyEmail(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Account verified successfully.',
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const payload = {
    email: req.user.email,
    password: req.body.newPassword,
    token: req.headers.authorization?.split(' ')[1],
  } as ResetPasswordPayload;

  const result = await AuthService.resetPassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully.',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  // const result = await AuthService.changePassword(req.body);
  // sendResponse(res, {
  //   statusCode: httpStatus.OK,
  //   success: true,
  //   message: 'Password changed successfully.',
  //   data: result,
  // });
});

const OAuthSignIn = catchAsync(async (req, res) => {
  console.log(req.body);
  const result = await AuthService.OAuthSignIn(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged in successfully.',
    data: result,
  });
});

export const AuthController = {
  signInUser,
  signUpUser,
  sendOtp,
  verifyAccount,
  resetPassword,
  changePassword,
  OAuthSignIn,
};
