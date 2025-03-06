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
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../config"));
const jwtHelper_1 = require("../helpers/jwtHelper");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth = (...roles) => {
    return (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        const verifiedUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.access_secret);
        req.user = verifiedUser;
        if (roles.length && !roles.includes(verifiedUser.role)) {
            throw new apiError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden!');
        }
        const isUserExist = yield prisma_1.default.users.findUnique({
            where: {
                id: verifiedUser.id,
                email: verifiedUser.email,
            },
        });
        if (!isUserExist) {
            throw new apiError_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
        }
        next();
    }));
};
exports.default = auth;
