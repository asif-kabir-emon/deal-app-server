import httpStatus from 'http-status';
import config from '../config';
import { jwtHelper } from '../helpers/jwtHelper';
import catchAsync from '../utils/catchAsync';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../utils/apiError';
import prisma from '../utils/prisma';

const auth = (...roles: string[]) => {
  return catchAsync(async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    const verifiedUser = jwtHelper.verifyToken(
      token,
      config.jwt.access_secret
    ) as JwtPayload;

    req.user = verifiedUser;

    if (roles.length && !roles.includes(verifiedUser.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden!');
    }

    const isUserExist = await prisma.users.findUnique({
      where: {
        id: verifiedUser.id,
        email: verifiedUser.email,
      },
    });

    if (!isUserExist) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
    }

    next();
  });
};

export default auth;
