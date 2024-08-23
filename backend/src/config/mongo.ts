import mongoose from 'mongoose';
import createCustomLogger from '../utils/logger';

const logger = createCustomLogger('mongo-service');
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/woovi-challenge';

export const connectToMongoDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        logger.info('Connected to MongoDB successfully');
    } catch (error) {
        if (!(error instanceof Error)) {
            logger.error('An unknown error occurred while connecting to MongoDB');
            process.exit(1);
        }
        logger.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
}
