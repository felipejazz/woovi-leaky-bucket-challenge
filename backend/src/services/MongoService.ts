import mongoose from 'mongoose';
import createCustomLogger from '../utils/logger';
import { Result } from '../models/Result';
import { FailedConnectMongo } from '../interfaces/Mongo/Errors';

const logger = createCustomLogger('mongo-service');

const mongoUri = 'mongodb://localhost:27017/wooviDatabase';
let isConnected = false

export const connectToMongo = async (): Promise<Result<void>> => {
    logger.info('Connecting to local MongoDB...');
    if (isConnected) {
        logger.info('Already connected to MongoDB.');
        return new Result({success: false, data:null, error: new Error('Mongo already connected')});
    }

    try {
        await mongoose.connect(mongoUri);
        isConnected = true;
        logger.info('Successfully connected to MongoDB.');
        return new Result({success: true, data: null});
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during connection';
        logger.error(`Error connecting to MongoDB: ${errorMessage}`);
        return new Result({success: false, data: null, error: new FailedConnectMongo()});
    }
};

export const disconnectFromMongo = async (): Promise<Result<void>> => {
    logger.info('Disconnecting from local MongoDB...');
    if (!isConnected) {
        logger.info('No active connection to MongoDB.');
        return new Result({success: false, data: null});
    }

    try {
        await mongoose.disconnect();
        isConnected = false
        logger.info('Successfully disconnected from MongoDB.');
        return new Result({success: true, data: null});
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during disconnection';
        logger.error(`Error disconnecting from MongoDB: ${errorMessage}`);
        return new Result({success: false, data: null, error: new FailedConnectMongo()});
    }
};
