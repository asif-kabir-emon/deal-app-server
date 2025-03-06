"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jwtHelper_1 = require("./../../helpers/jwtHelper");
const http_status_1 = __importDefault(require("http-status"));
const apiError_1 = __importDefault(require("../../utils/apiError"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../../config"));
const client_1 = require("@prisma/client");
const sendEmail_1 = require("../../utils/sendEmail");
const singInUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Check: User exists or not
    const isUserExist = yield prisma_1.default.users.findUnique({
        where: {
            email: payload.email,
        },
        include: {
            profile: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
        },
    });
    if (!isUserExist) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, 'User not found.');
    }
    if (isUserExist.password === '' || isUserExist.password === null) {
        throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, 'User is not registered with password. Please reset your password.');
    }
    // Check: Password match or not
    const isPasswordMatch = yield bcrypt_1.default.compare(payload.password, isUserExist.password);
    if (!isPasswordMatch) {
        throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid password.');
    }
    // Check: User is verified or not. If not send otp to verify.
    if (!isUserExist.isVerified) {
        // send otp
        sendOtp({
            email: isUserExist.email,
            type: client_1.OtpType.email_verification,
        });
        throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, 'User is not verified! Verification email is send. Please verify your email.');
    }
    // Generate token
    const jwtPayload = {
        id: isUserExist.id,
        email: isUserExist.email,
        role: isUserExist.role,
    };
    const token = jwtHelper_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt.access_secret, config_1.default.jwt.access_expires_in);
    return {
        token,
        user: {
            id: isUserExist.id,
            email: isUserExist.email,
            name: ((_a = isUserExist.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = isUserExist.profile) === null || _b === void 0 ? void 0 : _b.lastName),
            avatar: (_c = isUserExist.profile) === null || _c === void 0 ? void 0 : _c.avatar,
            role: isUserExist.role,
        },
        redirectUrl: '/',
    };
});
const signUpUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check: User exists or not
    const isUserExist = yield prisma_1.default.users.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (isUserExist) {
        throw new apiError_1.default(http_status_1.default.CONFLICT, 'User already exists.');
    }
    // Hash password
    const hashedPassword = yield bcrypt_1.default.hash(payload.password, config_1.default.bcrypt.salt_round);
    // Create user
    const user = yield prisma_1.default.$transaction((tsc) => __awaiter(void 0, void 0, void 0, function* () {
        const newUser = yield tsc.users.create({
            data: {
                email: payload.email,
                password: hashedPassword,
                role: client_1.UserRole.user,
                isVerified: false,
            },
        });
        const newUserProfile = yield tsc.profiles.create({
            data: {
                userId: newUser.id,
                firstName: payload.firstName || '',
                lastName: payload.lastName || '',
            },
        });
        if (newUser.password) {
            newUser.password = '';
        }
        return Object.assign(Object.assign({}, newUser), newUserProfile);
    }));
    if (!user) {
        throw new apiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create user.');
    }
    // send otp
    sendOtp({
        email: user.email,
        type: client_1.OtpType.email_verification,
    });
    return {
        user: user,
        redirectUrl: `/verify-user?email=${user.email}`,
    };
});
const sendOtp = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check: User exists or not
    const isUserExist = yield prisma_1.default.users.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!isUserExist) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, 'User not found.');
    }
    if (payload.type === client_1.OtpType.email_verification) {
        if (isUserExist.isVerified) {
            throw new apiError_1.default(http_status_1.default.BAD_REQUEST, 'User is already verified.');
        }
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 999999).toString();
        // Save OTP in database
        const otpData = yield prisma_1.default.oTP.upsert({
            where: {
                userId_type: {
                    userId: isUserExist.id,
                    type: payload.type,
                },
            },
            update: {
                code: otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
            create: {
                userId: isUserExist.id,
                code: otp,
                type: payload.type,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            },
        });
        if (!otpData) {
            throw new apiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to generate OTP.');
        }
        // Send OTP to email
        const verificationLink = `${config_1.default.FRONTEND_BASE_URL}/verify-user?email=${payload.email}`;
        yield (0, sendEmail_1.sendEmail)({
            to: payload.email,
            subject: 'Your One-Time Password (OTP) for Email Verification',
            html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #333;">OTP for Email Verification</h2>
        <p>Dear User,</p>
        <p>We received a request to verify your account. Please use the following One-Time Password (OTP) to proceed:</p>
        <p style="background: #f0f0f0; font-size: 24px; font-weight: bold; color: #333333; text-align: center; padding: 10px; display: inline-block;">${otp}</p>
        <p>This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone. If you did not request this verification, please ignore this email.</p>
        <p style="margin-top: 10px;">If you have not been redirected to the email verification page, please visit <a href="${verificationLink}" style="color: #007bff;">Verify Email</a></p>
        <br>
        <p>Best Regards,</p>
        <p><strong>${config_1.default.APP_NAME} Support Team</strong></p>
      </div>
      `,
        });
        return;
    }
    else if (payload.type === client_1.OtpType.password_reset) {
        // TODO: Implement password reset OTP
        // Generate token
        const jwtPayload = {
            id: isUserExist.id,
            email: isUserExist.email,
            role: isUserExist.role,
        };
        const token = jwtHelper_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt.access_secret, '1h');
        // Save OTP in database
        const otpData = yield prisma_1.default.oTP.upsert({
            where: {
                userId_type: {
                    userId: isUserExist.id,
                    type: payload.type,
                },
            },
            update: {
                code: token,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
            create: {
                userId: isUserExist.id,
                code: token,
                type: payload.type,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });
        console.log(otpData);
        if (!otpData) {
            throw new apiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to generate OTP.');
        }
        // Send OTP to email
        const resetLink = `${config_1.default.FRONTEND_BASE_URL}/reset-password?token=${token}`;
        yield (0, sendEmail_1.sendEmail)({
            to: payload.email,
            subject: 'One-time Password Reset Token',
            html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear User,</p>
        <p>We received a request to reset your password for your account.</p>
        <p>If you initiated this request, please click the button below to reset your password: </p>
        <p style="margin-top: 20px; margin-bottom: 40px;">
          <a href="${resetLink}" style="display: inline-block; background-color: #000000; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </p>
        <p>If the button above does not work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 5px;">${resetLink}</p>
        <p>This link is valid for <strong>1 hour</strong>. If you did not request a password reset, please ignore this email. No changes will be made to your account.</p>
        <br>
        <p>Best Regards,</p>
        <p><strong>${config_1.default.APP_NAME} Support Team</strong></p>
      </div>
      `,
        });
        return;
    }
    else {
        throw new apiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid OTP type.');
    }
});
const resetPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check: User exists or not
    const isUserExist = yield prisma_1.default.users.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!isUserExist) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, 'User not found.');
    }
    // Find OTP from database
    const otpData = yield prisma_1.default.oTP.findFirst({
        where: {
            userId: isUserExist.id,
            type: client_1.OtpType.password_reset,
            expiresAt: {
                gte: new Date(),
            },
        },
    });
    if (!otpData) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, 'OTP not found or expired.');
    }
    // Verify OTP
    if (payload.token !== otpData.code) {
        throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid OTP.');
    }
    // Check: Password match with previous password or not
    if (isUserExist.password) {
        const isPasswordMatch = yield bcrypt_1.default.compare(payload.password, isUserExist.password);
        if (isPasswordMatch) {
            throw new apiError_1.default(http_status_1.default.BAD_REQUEST, 'New password must be different from the previous password.');
        }
    }
    // Hash password
    const hashedPassword = yield bcrypt_1.default.hash(payload.password, config_1.default.bcrypt.salt_round);
    // Update password
    const updatedUser = yield prisma_1.default.users.update({
        where: {
            id: isUserExist.id,
        },
        data: {
            password: hashedPassword,
        },
    });
    if (!updatedUser) {
        throw new apiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to update password.');
    }
    // Delete OTP
    yield prisma_1.default.oTP.delete({
        where: {
            id: otpData.id,
            type: client_1.OtpType.password_reset,
        },
    });
    return;
});
const verifyEmail = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Check: User exists or not
    const isUserExist = yield prisma_1.default.users.findUnique({
        where: {
            email: payload.email,
        },
        include: {
            profile: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
        },
    });
    if (!isUserExist) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, 'User not found.');
    }
    // Find OTP from database
    const otpData = yield prisma_1.default.oTP.findFirst({
        where: {
            userId: isUserExist.id,
            type: client_1.OtpType.email_verification,
            expiresAt: {
                gte: new Date(),
            },
        },
    });
    if (!otpData) {
        throw new apiError_1.default(http_status_1.default.NOT_FOUND, 'OTP not found or expired.');
    }
    // Verify OTP
    if (payload.code !== otpData.code) {
        throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, 'Invalid OTP.');
    }
    // Update user
    const updatedUser = yield prisma_1.default.users.update({
        where: {
            id: isUserExist.id,
        },
        data: {
            isVerified: true,
        },
    });
    if (!updatedUser) {
        throw new apiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to verify email.');
    }
    // Delete OTP
    yield prisma_1.default.oTP.delete({
        where: {
            id: otpData.id,
            type: client_1.OtpType.email_verification,
        },
    });
    // generate token
    const jwtPayload = {
        id: isUserExist.id,
        email: isUserExist.email,
        role: isUserExist.role,
    };
    const token = jwtHelper_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt.access_secret, config_1.default.jwt.access_expires_in);
    return {
        token,
        user: {
            id: isUserExist.id,
            email: isUserExist.email,
            role: isUserExist.role,
            name: ((_a = isUserExist.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = isUserExist.profile) === null || _b === void 0 ? void 0 : _b.lastName),
            avatar: (_c = isUserExist.profile) === null || _c === void 0 ? void 0 : _c.avatar,
        },
        redirectUrl: null,
    };
});
const OAuthSignIn = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    let userData;
    const isUserExist = yield prisma_1.default.users.findFirst({
        where: {
            email: payload.email,
        },
        include: {
            profile: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
        },
    });
    if (isUserExist) {
        const isOAuthUserExist = yield prisma_1.default.oAuth.findFirst({
            where: {
                provider: payload.provider,
                providerId: payload.providerId,
            },
        });
        if (!isOAuthUserExist) {
            // Create OAuth User
            yield prisma_1.default.oAuth.create({
                data: {
                    provider: payload.provider,
                    providerId: payload.providerId,
                    userId: isUserExist.id,
                },
            });
        }
        if (!isUserExist.isVerified) {
            yield prisma_1.default.users.update({
                where: {
                    id: isUserExist.id,
                },
                data: {
                    isVerified: true,
                },
            });
        }
        userData = {
            id: isUserExist.id,
            email: isUserExist.email,
            role: isUserExist.role,
            name: ((_a = isUserExist.profile) === null || _a === void 0 ? void 0 : _a.firstName) + ' ' + ((_b = isUserExist.profile) === null || _b === void 0 ? void 0 : _b.lastName),
            avatar: (_c = isUserExist.profile) === null || _c === void 0 ? void 0 : _c.avatar,
        };
    }
    else {
        // Create User
        const user = yield prisma_1.default.$transaction((tsc) => __awaiter(void 0, void 0, void 0, function* () {
            const newUser = yield tsc.users.create({
                data: {
                    email: payload.email,
                    role: client_1.UserRole.user,
                    isVerified: true,
                },
            });
            const newUserProfile = yield tsc.profiles.create({
                data: {
                    userId: newUser.id,
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                },
            });
            // Create OAuth User
            yield tsc.oAuth.create({
                data: {
                    provider: payload.provider,
                    providerId: payload.providerId,
                    userId: newUser.id,
                },
            });
            return Object.assign(Object.assign({}, newUser), newUserProfile);
        }));
        userData = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.firstName + ' ' + user.lastName,
            avatar: user.avatar,
        };
    }
    // Generate token
    const jwtPayload = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
    };
    const token = jwtHelper_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt.access_secret, config_1.default.jwt.access_expires_in);
    return {
        token: token,
        user: userData,
        redirectUrl: null,
        expiresIn: config_1.default.jwt.access_expires_in,
    };
});
exports.AuthService = {
    singInUser,
    signUpUser,
    sendOtp,
    resetPassword,
    verifyEmail,
    OAuthSignIn,
};
