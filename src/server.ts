import { PrismaClient } from '@prisma/client';
import app from './app';
import config from './config';

const prisma = new PrismaClient();
let server: any;
const PORT = config.PORT;

async function main() {
  try {
    // Connect to the database before starting the server
    await prisma.$connect();
    console.log('✅ Connected to the database');

    server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  if (server) {
    server.close(async () => {
      console.log('🛑 HTTP server closed.');
      await prisma.$disconnect(); // Close Prisma connection
      console.log('✅ Prisma disconnected.');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

// Handle process events
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('unhandledRejection', gracefulShutdown);
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  gracefulShutdown();
});
