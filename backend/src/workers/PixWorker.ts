import { Worker, Job } from 'bullmq';
import RedisService from '../services/RedisService';
import { PixService } from '../services/PixService';
import createCustomLogger from '../utils/logger';
import { BucketNoValidTokensError, BucketRevokeTokenError, NoTokenToConsumeError } from '../interfaces/Bucket/Errors';
import { InvalidPixKeyError, InvalidPixValueError, PixTooManyRequestsError } from '../interfaces/Pix/Errors';
import { UserService } from '../services/UserService';
import { BucketService } from '../services/BucketService';
import { IDocumentBucket } from '../interfaces/Bucket/IDocumentBucket';
import { removeEmitHelper } from 'typescript';

class PixWorker {
    private worker!: Worker;
    private logger = createCustomLogger('pix-worker');

    constructor() {}

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
        const { userName, bucket, token, key, value }: { userName: string, bucket: IDocumentBucket, token: string, key: any, value: any } = job.data;
        const lockKey = `lock:pix:${userName}`;
        const workerToken = job.token ?? 'default-token';

        let lockAcquired = false;

        try {
            lockAcquired = await RedisService.acquireLock(lockKey, 5000);
            if (!lockAcquired) {
                this.logger.warn(`Could not acquire lock for user ${userName}. Re-enqueuing job.`);
                await job.moveToDelayed(6000, workerToken);
                return;
            }
            this.logger.warn(`Lock acquired for ${userName}.`);

            const userResponse = await UserService.getUser(userName);
            if (!userResponse.success) {
                this.logger.error(`Pix processing failed for user: ${userName}.`);
                throw userResponse.error;
            }

            if (bucket.tokens.length === 0) {
                this.logger.error(`No valid tokens. Pix processing failed for user: ${userName}.`);
                throw new BucketNoValidTokensError('No valid tokens available.');
            }

            const checkResult = PixService.checkPixParameters(key, value);
            if (!checkResult.success) {
                this.logger.error(`Pix processing failed for user: ${userName}.`);
                throw checkResult.error;
            }

        } catch (error) {
            if (error instanceof NoTokenToConsumeError || error instanceof InvalidPixKeyError || error instanceof InvalidPixValueError) {
                this.logger.error(`Pix error encountered: ${error.message}`);
                if (bucket.tokens.length === 0 && bucket.outOfTokens) {
                    throw new PixTooManyRequestsError();
                }
                if (bucket.tokens.length === 0 && !bucket.outOfTokens) {
                    bucket.outOfTokens = true;
                    const updateResult = await BucketService.updateBucket(bucket);
                    if (!updateResult || !updateResult.success) {
                        throw new Error("Unexpected Error updating user out of token");
                    }
                    throw error;
                }
                const revokeResult = await BucketService.revokeToken({ bucket, token });
                if(revokeResult.error){
                    throw revokeResult.error
                }
                throw error;
            } else if (error instanceof BucketNoValidTokensError) {
                throw error;
            } else {
                this.logger.error(`An unknown error occurred: ${String(error)}`);
                throw error;
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
