import { Bucket } from '../models/Bucket';
import { BucketService } from './BucketService';
import { NoValidTokens, TokenNotFound } from '../interfaces/Bucket/Errors';
import createCustomLogger from '../utils/logger';
import { AuthService } from './AuthService';
import { AuthController } from '../controllers/AuthController';
import { InvalidPixKeyError, InvalidPixValueError } from '../interfaces/Pix/Errors';

const logger = createCustomLogger('pix-service');

export class PixService {
    static makePix({ userId, key, value, token }: { userId: string, key: string, value: number, token: string }): boolean {
        logger.info(`Simulating Pix Service query for user: ${userId}`);
        
        const user = AuthService.getUserById(userId);
        if (!user) {
            logger.warn(`User not found for ID: ${userId}`);
            throw new Error('User not found');
        }

        let bucket = BucketService.getBucketByUserId(userId);
        if (!bucket) {
            logger.warn(`Bucket not found for user: ${user.username}`);
            throw new Error('Bucket not found');
        }
        BucketService.checkBucket({ bucket, token });
        this.checkPixParameters(key, value);
        logger.info(`Pix query successful for user: ${user.username}, key: ${key}, value: ${value}`);
        return true;
    }

    static isValidPixKey(key: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    
        if (!emailRegex.test(key) && !phoneRegex.test(key)) {
            logger.warn(`Invalid Pix key format: ${key}`);
            throw new InvalidPixKeyError(key);
        }
    
        return true;
    }
    
    static isValidPixValue(value: number): boolean {
        if (typeof value !== 'number' || value <= 0) {
            logger.warn(`Invalid transfer value: ${value}`);
            throw new InvalidPixValueError(value);
        }
        return true;
    }
    static checkPixParameters(key: string, value: number): boolean {
        if (!this.isValidPixKey(key)) {
            throw new InvalidPixKeyError(key);
        }

        if (!this.isValidPixValue(value)) {
            throw new InvalidPixValueError(value);
        }

        return true;
    }
}
