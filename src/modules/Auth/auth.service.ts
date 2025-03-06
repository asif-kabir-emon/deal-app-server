import { jwtHelper } from './../../helpers/jwtHelper';
import httpStatus from 'http-status';
import ApiError from '../../utils/apiError';
import prisma from '../../utils/prisma';
import {
  OAuthSignInPayload,
  ResetPasswordPayload,
  SendOtpPayload,
  SignInPayload,
  SignUpPayload,
  VerifyEmailPayload,
} from './auth.interface';
import bcrypt from 'bcrypt';
import { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import { OtpType, Prisma, UserRole } from '@prisma/client';
import { sendEmail } from '../../utils/sendEmail';

const singInUser = async (payload: SignInPayload) => {
  // Check: User exists or not
  const isUserExist = await prisma.users.findUnique({
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
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  if (isUserExist.password === '' || isUserExist.password === null) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'User is not registered with password. Please reset your password.'
    );
  }

  // Check: Password match or not
  const isPasswordMatch = await bcrypt.compare(
    payload.password,
    isUserExist.password
  );

  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid password.');
  }

  // Check: User is verified or not. If not send otp to verify.
  if (!isUserExist.isVerified) {
    // send otp
    sendOtp({
      email: isUserExist.email,
      type: OtpType.email_verification,
    });

    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'User is not verified! Verification email is send. Please verify your email.'
    );
  }

  // Generate token
  const jwtPayload = {
    id: isUserExist.id,
    email: isUserExist.email,
    role: isUserExist.role,
  } as JwtPayload;

  const token = jwtHelper.generateToken(
    jwtPayload,
    config.jwt.access_secret,
    config.jwt.access_expires_in
  );

  return {
    token,
    user: {
      id: isUserExist.id,
      email: isUserExist.email,
      name:
        isUserExist.profile?.firstName + ' ' + isUserExist.profile?.lastName,
      avatar: isUserExist.profile?.avatar,
      role: isUserExist.role,
    },
    redirectUrl: '/',
  };
};

const signUpUser = async (payload: SignUpPayload) => {
  // Check: User exists or not
  const isUserExist = await prisma.users.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isUserExist) {
    throw new ApiError(httpStatus.CONFLICT, 'User already exists.');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt.salt_round
  );

  // Create user
  const user = await prisma.$transaction(
    async (tsc: Prisma.TransactionClient) => {
      const newUser = await tsc.users.create({
        data: {
          email: payload.email,
          password: hashedPassword,
          role: UserRole.user,
          isVerified: false,
        },
      });

      const newUserProfile = await tsc.profiles.create({
        data: {
          userId: newUser.id,
          firstName: payload.firstName || '',
          lastName: payload.lastName || '',
        },
      });

      if (newUser.password) {
        newUser.password = '';
      }

      return {
        ...newUser,
        ...newUserProfile,
      };
    }
  );

  if (!user) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create user.'
    );
  }

  // send otp
  sendOtp({
    email: user.email,
    type: OtpType.email_verification,
  });

  return {
    user: user,
    redirectUrl: `/verify-user?email=${user.email}`,
  };
};

const sendOtp = async (payload: SendOtpPayload) => {
  // Check: User exists or not
  const isUserExist = await prisma.users.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  if (payload.type === OtpType.email_verification) {
    if (isUserExist.isVerified) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User is already verified.');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 999999).toString();

    // Save OTP in database
    const otpData = await prisma.oTP.upsert({
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
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to generate OTP.'
      );
    }

    // Send OTP to email
    const verificationLink = `${config.FRONTEND_BASE_URL}/verify-user?email=${payload.email}`;

    await sendEmail({
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
        <p><strong>${config.APP_NAME} Support Team</strong></p>
      </div>
      `,
    });

    return;
  } else if (payload.type === OtpType.password_reset) {
    // TODO: Implement password reset OTP
    // Generate token
    const jwtPayload = {
      id: isUserExist.id,
      email: isUserExist.email,
      role: isUserExist.role,
    } as JwtPayload;

    const token = jwtHelper.generateToken(
      jwtPayload,
      config.jwt.access_secret,
      '1h'
    );

    // Save OTP in database
    const otpData = await prisma.oTP.upsert({
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
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Failed to generate OTP.'
      );
    }

    // Send OTP to email
    const resetLink = `${config.FRONTEND_BASE_URL}/reset-password?token=${token}`;

    await sendEmail({
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
        <p><strong>${config.APP_NAME} Support Team</strong></p>
      </div>
      `,
    });

    return;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP type.');
  }
};

const resetPassword = async (payload: ResetPasswordPayload) => {
  // Check: User exists or not
  const isUserExist = await prisma.users.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  // Find OTP from database
  const otpData = await prisma.oTP.findFirst({
    where: {
      userId: isUserExist.id,
      type: OtpType.password_reset,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  if (!otpData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'OTP not found or expired.');
  }

  // Verify OTP
  if (payload.token !== otpData.code) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid OTP.');
  }

  // Check: Password match with previous password or not
  if (isUserExist.password) {
    const isPasswordMatch = await bcrypt.compare(
      payload.password,
      isUserExist.password
    );

    if (isPasswordMatch) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'New password must be different from the previous password.'
      );
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt.salt_round
  );

  // Update password
  const updatedUser = await prisma.users.update({
    where: {
      id: isUserExist.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  if (!updatedUser) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update password.'
    );
  }

  // Delete OTP
  await prisma.oTP.delete({
    where: {
      id: otpData.id,
      type: OtpType.password_reset,
    },
  });

  return;
};

const verifyEmail = async (payload: VerifyEmailPayload) => {
  // Check: User exists or not
  const isUserExist = await prisma.users.findUnique({
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
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found.');
  }

  // Find OTP from database
  const otpData = await prisma.oTP.findFirst({
    where: {
      userId: isUserExist.id,
      type: OtpType.email_verification,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  if (!otpData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'OTP not found or expired.');
  }

  // Verify OTP
  if (payload.code !== otpData.code) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid OTP.');
  }

  // Update user
  const updatedUser = await prisma.users.update({
    where: {
      id: isUserExist.id,
    },
    data: {
      isVerified: true,
    },
  });

  if (!updatedUser) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to verify email.'
    );
  }

  // Delete OTP
  await prisma.oTP.delete({
    where: {
      id: otpData.id,
      type: OtpType.email_verification,
    },
  });

  // generate token
  const jwtPayload = {
    id: isUserExist.id,
    email: isUserExist.email,
    role: isUserExist.role,
  } as JwtPayload;

  const token = jwtHelper.generateToken(
    jwtPayload,
    config.jwt.access_secret,
    config.jwt.access_expires_in
  );

  return {
    token,
    user: {
      id: isUserExist.id,
      email: isUserExist.email,
      role: isUserExist.role,
      name:
        isUserExist.profile?.firstName + ' ' + isUserExist.profile?.lastName,
      avatar: isUserExist.profile?.avatar,
    },
    redirectUrl: null,
  };
};

const OAuthSignIn = async (payload: OAuthSignInPayload) => {
  let userData;

  const isUserExist = await prisma.users.findFirst({
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
    const isOAuthUserExist = await prisma.oAuth.findFirst({
      where: {
        provider: payload.provider,
        providerId: payload.providerId,
      },
    });

    if (!isOAuthUserExist) {
      // Create OAuth User
      await prisma.oAuth.create({
        data: {
          provider: payload.provider,
          providerId: payload.providerId,
          userId: isUserExist.id,
        },
      });
    }

    if (!isUserExist.isVerified) {
      await prisma.users.update({
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
      name:
        isUserExist.profile?.firstName + ' ' + isUserExist.profile?.lastName,
      avatar: isUserExist.profile?.avatar,
    };
  } else {
    // Create User
    const user = await prisma.$transaction(
      async (tsc: Prisma.TransactionClient) => {
        const newUser = await tsc.users.create({
          data: {
            email: payload.email,
            role: UserRole.user,
            isVerified: true,
          },
        });

        const newUserProfile = await tsc.profiles.create({
          data: {
            userId: newUser.id,
            firstName: payload.firstName,
            lastName: payload.lastName,
            avatar: payload.avatar,
          },
        });

        // Create OAuth User
        await tsc.oAuth.create({
          data: {
            provider: payload.provider,
            providerId: payload.providerId,
            userId: newUser.id,
          },
        });

        return {
          ...newUser,
          ...newUserProfile,
        };
      }
    );

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
    name: userData.name,
    avatar: userData.avatar,
  } as JwtPayload;

  const token = jwtHelper.generateToken(
    jwtPayload,
    config.jwt.access_secret,
    config.jwt.access_expires_in
  );

  return {
    token: token,
    user: userData,
    redirectUrl: null,
    expiresIn: config.jwt.access_expires_in,
  };
};

export const AuthService = {
  singInUser,
  signUpUser,
  sendOtp,
  resetPassword,
  verifyEmail,
  OAuthSignIn,
};
