import { Worker, Job } from 'bullmq';
import RedisService from '../services/RedisService';
import { PixService } from '../services/PixService';
import createCustomLogger from '../utils/logger';
import { NoTokenToConsumeError } from '../interfaces/Bucket/Errors';
import { InvalidPixKeyError, InvalidPixValueError } from '../interfaces/Pix/Errors';
import { AuthService } from '../services/AuthService';

class PixWorker {
    private worker!: Worker;
    private logger = createCustomLogger('pix-worker');

    constructor() {
    }

    public async initialize() {
        await this.initializeWorker();
    }

    private async initializeWorker() {
        await RedisService.initialize(); 
        this.worker = new Worker('pixQueue', this.processJob.bind(this), {
            connection: RedisService.getInstance().redis,
        });
        this.logger.info('PixWorker initialized successfully.');
    }
    private async processJob(job: Job): Promise<void> {
        const { userName, key, value } = job.data;
        const lockKey = `lock:pix:${userName}`;
        let lockAcquired = false;
        const workerToken = job.token ?? 'default-token';

        try {   
            this.logger.warn(`Trying to acquire lock for ${userName}.`);

            lockAcquired = await RedisService.acquireLock(lockKey, 5000);
            if (!lockAcquired) {
                this.logger.warn(`Could not acquire lock for user ${userName}. Re-enqueuing job.`);
                await job.moveToDelayed(6000, workerToken);
                return;
            }
            this.logger.warn(`Lock acquired for ${userName}.`);
            const userResponse = await AuthService.getUser(userName);
            if (!userResponse.success) {
                const jobState = await job.getState();
                this.logger.info(`State of job ${job.id}: ${jobState}`);
                this.logger.error(`Pix processing failed for user: ${userName}.`);
                throw userResponse.error;
            }
            const user = userResponse.data;
    
            if (user?.noValidTokens) {
                const jobState = await job.getState();
                this.logger.info(`State of job ${job.id}: ${jobState}`);
                this.logger.error(`No valid tokens. Pix processing failed for user: ${userName}.`);
                throw userResponse.error;
            }

            const result = PixService.checkPixParameters(key, value);

            if (!result.success) {
                const jobState = await job.getState();
                this.logger.info(`State of job ${job.id}: ${jobState}`);
                this.logger.error(`Pix processing failed for user: ${userName}.`);
                throw result.error;
            }
        } catch (error) {
            this.logger.error(`Error processing job ${job.id}: ${String(error)}`);

            if (error instanceof Error) {
                if (
                    error instanceof NoTokenToConsumeError ||
                    error instanceof InvalidPixKeyError ||
                    error instanceof InvalidPixValueError
                ) {
                    this.logger.error(`Non-retriable error encountered: ${error.message}`);
                    throw error;
                }
            } else {
                this.logger.error(`An unknown error occurred: ${String(error)}`);
            }
        } finally {
            if (lockAcquired) {
                await RedisService.releaseLock(lockKey);
                this.logger.info(`Lock released for user: ${userName}`);
            }
        }
    }

    public async closeWorker(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
            this.logger.info('Worker closed successfully');
        }
    }
}

export default PixWorker;
