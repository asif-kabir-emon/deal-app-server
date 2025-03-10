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
exports.sendEmail = void 0;
const http_status_1 = __importDefault(require("http-status"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const apiError_1 = __importDefault(require("./apiError"));
const sendEmail = (_a) => __awaiter(void 0, [_a], void 0, function* ({ to, subject, html, plainText, }) {
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: config_1.default.nodemailer.host,
            port: config_1.default.nodemailer.port,
            secure: config_1.default.nodemailer.secure,
            auth: {
                user: config_1.default.nodemailer.user,
                pass: config_1.default.nodemailer.pass,
            },
        });
        const info = yield transporter.sendMail({
            from: `"${config_1.default.APP_NAME}" <${config_1.default.nodemailer.user}>`,
            to: to,
            subject: subject,
            text: plainText,
            html: html,
        });
        if (info.accepted.length === 0) {
            throw new apiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to send email');
        }
        return info;
    }
    catch (error) {
        throw new apiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to send email');
    }
});
exports.sendEmail = sendEmail;
