import createCustomLogger from '../utils/logger';
import { InvalidPixKeyError, InvalidPixValueError, PixError } from '../interfaces/Pix/Errors';
import RedisService from './RedisService';
import { Queue, Job, QueueEvents } from 'bullmq';
import { Result } from '../models/Result';
import { BucketService } from './BucketService';
import { BucketNotFoundError, BucketNoValidTokensError, NoTokenToConsumeError } from '../interfaces/Bucket/Errors';
import { AuthService } from './AuthService';

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

    static async makePix({ userName, key, value }: { userName: string, key: string, value: number }): Promise<Result<{ token: string | null, count: number | null }>> {        
        await this.initialize()
        logger.info(`Enqueueing Pix request for user: ${userName}`);
    
        const job = await this.pixQueue.add('process-pix', { userName, key, value }, {
            attempts: 1,
            backoff: 0,
        });
    
        logger.info(`Job added to queue with ID: ${job.id}`);
    
        const result = await this.waitForJobCompletion(job);
        const userResult = await AuthService.getUser(userName);
        if (!userResult) {
            const error = new Error('Cannot retrieve user to consume token');
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: null });
        }
        if (!userResult.success) {
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: userResult.error, data: null });
        }
        if (!userResult.data) {
            const error = new Error('Failed to retrieve user data to consume token');
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: null });
        }
        
        const userToConsume = userResult.data;
        const userToken = userToConsume.token;
        
        const tokenCountResult = await BucketService.getTokenCount(userToConsume); 
        if (!tokenCountResult) {
            const error = new Error('Cannot retrieve token counts before consume');
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: { token: userToken, count: null }  });
        }
        if (!tokenCountResult.success) {
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: tokenCountResult.error, data: { token: userToken, count: null }  });
        }
        if (!tokenCountResult.data) {
            const error = new Error('Failed to retrieve bucket tokens count');
            return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: { token: userToken, count: null }  });
        }
        const tokenCount = tokenCountResult.data
        if (result instanceof Error) {
            logger.error(result.message)
            const pixError = this.createPixError(result.message);
            
    
            if (!(pixError instanceof NoTokenToConsumeError ||
                pixError instanceof InvalidPixKeyError ||
                pixError instanceof InvalidPixValueError ||
                pixError instanceof BucketNotFoundError)) {
                    
                    logger.error("xiiiiiiii")
                return new Result<{ token: string | null, count: number | null }>({ success: false, error: pixError, data: { token: userToken, count: tokenCount } });
            }
    
            const consumeResult = await BucketService.consumeToken(userToConsume);
            if (!consumeResult) {
                const error = new Error("Error consuming token");
                return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: { token: userToken, count: tokenCount } });
            }
            if (!consumeResult.success) {
                return new Result<{ token: string | null, count: number | null }>({ success: false, error: consumeResult.error, data: { token: userToken, count: tokenCount } });
            }
            const userWithNewTokenResult = await BucketService.getTokenToConsume(userToConsume);
            if (!userWithNewTokenResult) {
                const error = new Error("Error updating token after consume");
                return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: { token: userToken, count: 0 } });
            }
            if (!userWithNewTokenResult.success) {
                return new Result<{ token: string | null, count: number | null }>({ success: false, error: userWithNewTokenResult.error, data: { token: userToken, count: 0 } });
            }
            const newUserToken = userWithNewTokenResult.data;
            const tokenCountAfterConsumeResult = await BucketService.getTokenCount(userToConsume); 
            if (!tokenCountAfterConsumeResult) {
                const error = new Error('Cannot retrieve token counts before consume');
                return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: { token: userToken, count: null }  });
            }
            if (!tokenCountAfterConsumeResult.success) {

                const tokenCount = tokenCountAfterConsumeResult.data
                return new Result<{ token: string | null, count: number | null }>({ success: false, error: tokenCountResult.error, data: { token: userToken, count: tokenCount }  });
            }
            if (!tokenCountAfterConsumeResult.data && tokenCountAfterConsumeResult.data !== 0 ) {
                logger.info(tokenCountAfterConsumeResult.data)
                const error = new Error('Failed to retrieve bucket tokens count');
                return new Result<{ token: string | null, count: number | null }>({ success: false, error: error, data: { token: userToken, count: null }  });
            }
            const tokenCountAfterConsume = tokenCountAfterConsumeResult.data
            logger.warn(`Token consumed for user ${userName} due to failure.`);
            return new Result<{ token: string | null, count: number | null }>({ success: false, data: { token: newUserToken, count: tokenCountAfterConsume }, error: pixError });
        }


        return new Result<{ token: string | null, count: number | null }>({ success: true, data: { token: userToken, count: tokenCount } });
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
        } else {
            return new Error(message);
        }
    }
    
    
}
