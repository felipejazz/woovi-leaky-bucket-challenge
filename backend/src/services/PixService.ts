import createCustomLogger from '../utils/logger';
import { InvalidPixKeyError, InvalidPixValueError, PixError, PixTooManyRequestsError } from '../interfaces/Pix/Errors';
import RedisService from './RedisService';
import { Queue, Job, QueueEvents } from 'bullmq';
import { Result } from '../models/Result';
import { BucketService } from './BucketService';
import { BucketNotFoundError, BucketNoValidTokensError, BucketRevokeTokenError, NoTokenToConsumeError } from '../interfaces/Bucket/Errors';
import { UserService } from './UserService';

const logger = createCustomLogger('pix-service');


export class PixService {
    private static pixQueue: Queue;
    private static pixQueueEvents: QueueEvents;

    static async initialize(): Promise<void> {
        if (!this.pixQueue) {
            this.pixQueue = new Queue('pixQueue', {
                connection: RedisService.getInstance().redis,
            });
        }

        if (!this.pixQueueEvents) {
            this.pixQueueEvents = new QueueEvents('pixQueue', {
                connection: RedisService.getInstance().redis,
            });
        }

        logger.info('PixService initialized successfully.');
    }

    static async makePix({ userName, token, key, value }: { userName: string, key: string, value: number, token:string }): Promise<Result<{ token: string | null, count: number | null }>> {        
        await this.initialize()
        logger.info(`Enqueueing Pix request for user: ${userName}`);
        const bucketResult = await BucketService.getBucket(userName);
        if (!bucketResult) {
            const error = new Error('Cannot retrieve bucket to consume token');
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: null });
        }
        if (!bucketResult.success) {
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: bucketResult.error, data: null });
        }
        if (!bucketResult.data) {
            const error = new Error('Failed to retrieve bucket data to consume token');
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: null });
        }
        const bucket = bucketResult.data
    
        const job = await this.pixQueue.add('process-pix', { userName, bucket, token, key, value }, {
            attempts: 1,
            backoff: 0,
        });
    
        logger.info(`Job added to queue with ID: ${job.id}`);
    
        const jobResult = await this.waitForJobCompletion(job);
        const bucketAfterPixResult = await BucketService.getBucket(userName);
        if (!bucketAfterPixResult) {
            const error = new Error('Cannot retrieve user to consume token');
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: null });
        }
        if (!bucketAfterPixResult.success) {
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: bucketResult.error, data: null });
        }
        if (!bucketAfterPixResult.data) {
            const error = new Error('Failed to retrieve user data to consume token');
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: null });
        }
        const bucketAfterPix = bucketAfterPixResult.data
        const tokensLeft = bucketAfterPix.tokens.length
        let newUserToken
        if(jobResult instanceof Error) {
            this.createPixError(jobResult.message)

            newUserToken = bucketAfterPix.tokens[0]
            console.log(newUserToken)
            console.log(token)
            logger.error("Pix ended with failure")
            return new Result<{ token: string | null, count: number | null }>({success:false, data: {token: newUserToken, count: tokensLeft }, error: jobResult})
        }
        newUserToken = token
    
        return new Result<{ token: string | null, count: number | null }>({ success: true, data: { token: newUserToken, count: tokensLeft } });
    }
    private static async waitForJobCompletion(job: Job): Promise<Error | boolean> {
        return job.waitUntilFinished(this.pixQueueEvents)
            .then(() => {
                logger.info(`Job ${job.id} completed successfully.`);
                return true;  
            })
            .catch((error) => {
                if (!(error instanceof Error)) {
                    logger.error('Error is not an instance of Error, wrapping it in a new Error.');
                    error = new Error(typeof error === 'string' ? error : 'Unknown error');
                }
                error = this.createPixError(error.message)
                console.log(error instanceof BucketRevokeTokenError)
    
                logger.error(`Job ${job.id} failed with error: ${error.message}`);
                return error;
            });
    }
    

    static isValidPixKey(key: string): Result<boolean> {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;

        if (!emailRegex.test(key) && !phoneRegex.test(key)) {
            logger.warn(`Invalid Pix key format: ${key}`);
            return new Result<boolean>({ success: false, data: null, error: new InvalidPixKeyError(key) });
        }

        return new Result<boolean>({ success: true, data: true });
    }
    
    static isValidPixValue(value: number): Result<boolean> {
        if (typeof value !== 'number' || value <= 0) {
            logger.warn(`Invalid transfer value: ${value}`);
            return new Result<boolean>({ success: false, data: null, error: new InvalidPixValueError(value) });
        }
        return new Result<boolean>({ success: true, data: true });
    }

    static checkPixParameters(key: string, value: number): Result<boolean> {
        const keyValidation = this.isValidPixKey(key);
        if (!keyValidation.success) {
            return keyValidation;
        }

        const valueValidation = this.isValidPixValue(value);
        if (!valueValidation.success) {
            return valueValidation;
        }
        return new Result<boolean>({ success: true, data: true });
    }

    static async closeQueues(): Promise<void> {
        await this.pixQueue.close();
        await this.pixQueueEvents.close();
    }

    static createPixError(message: string): PixError {
        logger.warn(message)
        if (message === 'Invalid PIX VALUE. only positives values are allowed.') {
            return new InvalidPixValueError();
        } else if (message === 'No valid token token to consume in bucket') {
            return new BucketNoValidTokensError(message);
        } else if (message === 'Invalid PIX KEY FORMAT. Allowed format: email@example.om or telephone +5511999999999') {
            return new InvalidPixKeyError();
            
        } else if (message === 'Bucket not found in MongoDb') {
            return new BucketNotFoundError(message);
        }  else if (message === 'Token is already revoked') {
            return new BucketRevokeTokenError(message)
        } else if  (message === 'Too many requests'){
            return new PixTooManyRequestsError(message)
        }
        else {
            return new Error(message);
        }
    }
}
