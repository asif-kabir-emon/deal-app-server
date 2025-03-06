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
const client_1 = require("@prisma/client");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const prisma = new client_1.PrismaClient();
let server;
const PORT = config_1.default.PORT;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to the database before starting the server
            yield prisma.$connect();
            console.log('✅ Connected to the database');
            server = app_1.default.listen(PORT, () => {
                console.log(`🚀 Server is running on port ${PORT}`);
            });
        }
        catch (error) {
            console.error('❌ Failed to connect to the database:', error);
            process.exit(1);
        }
    });
}
main();
// Graceful shutdown
const gracefulShutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('🛑 Shutting down gracefully...');
    if (server) {
        server.close(() => __awaiter(void 0, void 0, void 0, function* () {
            console.log('🛑 HTTP server closed.');
            yield prisma.$disconnect(); // Close Prisma connection
            console.log('✅ Prisma disconnected.');
            process.exit(0);
        }));
    }
    else {
        yield prisma.$disconnect();
        process.exit(0);
    }
});
// Handle process events
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('unhandledRejection', gracefulShutdown);
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    gracefulShutdown();
});
