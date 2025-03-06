"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
exports.default = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: Number(process.env.PORT) || 4000,
    APP_NAME: process.env.APP_NAME || 'NodeJS API',
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL,
    jwt: {
        access_secret: process.env.ACCESS_SECRET || 'access_secret',
        access_expires_in: process.env.ACCESS_EXPIRES_IN || '1d',
    },
    bcrypt: {
        salt_round: Number(process.env.SALT_ROUND) || 10,
    },
    nodemailer: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT) || 587,
        secure: process.env.MAIL_SECURE === 'true',
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
};
