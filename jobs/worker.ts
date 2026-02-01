import dotenv from 'dotenv';
dotenv.config();

import { startWorker, stopWorker } from './storeGenerator';

// ============================================
// Worker Entry Point
// ============================================

console.log('🚀 Starting Dropifi worker...');

// Start the worker
const worker = startWorker();

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n📥 Received ${signal}, shutting down gracefully...`);
  
  await stopWorker();
  
  console.log('👋 Worker shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
});

console.log('✅ Worker started and listening for jobs');

