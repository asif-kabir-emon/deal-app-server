import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/sign-in',
  validateRequest(AuthValidation.signInSchema),
  AuthController.signInUser
);

router.post(
  '/sign-up/user',
  validateRequest(AuthValidation.signUpSchema),
  AuthController.signUpUser
);

router.post(
  '/send-otp',
  validateRequest(AuthValidation.sendOtpSchema),
  AuthController.sendOtp
);

router.post(
  '/verify-account',
  validateRequest(AuthValidation.verifyAccountSchema),
  AuthController.verifyAccount
);

router.post(
  '/reset-password',
  auth(),
  validateRequest(AuthValidation.ResetPasswordSchema),
  AuthController.resetPassword
);

export const AuthRoutes = router;
