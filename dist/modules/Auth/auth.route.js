"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const auth_controller_1 = require("./auth.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.post('/sign-in', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.signInSchema), auth_controller_1.AuthController.signInUser);
router.post('/sign-up/user', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.signUpSchema), auth_controller_1.AuthController.signUpUser);
router.post('/send-otp', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.sendOtpSchema), auth_controller_1.AuthController.sendOtp);
router.post('/verify-account', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.verifyAccountSchema), auth_controller_1.AuthController.verifyAccount);
router.post('/reset-password', (0, auth_1.default)(), (0, validateRequest_1.default)(auth_validation_1.AuthValidation.ResetPasswordSchema), auth_controller_1.AuthController.resetPassword);
router.post('/change-password', (0, auth_1.default)(), 
// validateRequest(AuthValidation.ChangePasswordSchema),
auth_controller_1.AuthController.changePassword);
router.post('/oauth-sign-in', (0, validateRequest_1.default)(auth_validation_1.AuthValidation.OAuthSignInSchema), auth_controller_1.AuthController.OAuthSignIn);
exports.AuthRoutes = router;
