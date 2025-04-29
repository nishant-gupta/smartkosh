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
const queue_1 = __importDefault(require("../lib/queue"));
// This file is meant to be run in a separate process from the web server
// It will process jobs added to the queue
console.log('CSV Upload Worker started. Waiting for jobs...');
// Listen for queue events
queue_1.default.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result:`, result);
});
queue_1.default.on('failed', (job, error) => {
    console.error(`Job ${job.id} failed with error:`, error.message);
});
// Process errors
queue_1.default.on('error', (error) => {
    console.error('Queue error:', error);
});
// Keep the process running
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Worker received SIGTERM signal, closing queue...');
    yield queue_1.default.close();
    process.exit(0);
}));
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Worker received SIGINT signal, closing queue...');
    yield queue_1.default.close();
    process.exit(0);
}));
// The queue processor is defined in the queue.ts file
// This file just starts the worker process 
