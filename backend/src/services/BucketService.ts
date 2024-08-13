import { Bucket } from "../models/Bucket";
import { AuthService } from "./AuthService";
import { NoValidTokens, TokenNotFound } from "../interfaces/Bucket/Errors";
import createCustomLogger from "../utils/logger";
import { IAuthUser } from "../interfaces/User/IAuthUser";


const MAX_TOKENS = 10;
const TOKENS_INTERVAL = 3600000;
const logger = createCustomLogger('bucket-service');

const BUCKETS_DB: Bucket[] = [];

export class BucketService {
    static startService(bucket: Bucket) {
        logger.info(`Starting Bucket service for user: ${bucket.user.username}`);

        const userId = bucket.user.id;
        const user = AuthService.getUserById(userId);
        if (!user) {
            logger.warn(`User with ID: ${userId} not found, cannot start Bucket service`);
            throw new Error(`User with ID: ${userId} not found, cannot start Bucket service`);

        }

        let userBucket = this.getBucketByUserId(userId);

        if (!userBucket) {
            userBucket = this.createBucket(user);
        }

        if (userBucket && !userBucket.serviceStarted) {
            logger.info(`Initializing token service for user: ${userBucket.user.username}`);
            userBucket.tokens = [];
            for (let i = 0; i < MAX_TOKENS; i++) {
                const token = AuthService.generateToken(userBucket.user);
                userBucket.tokens.push(token);
                logger.info(`Token new token added to user bucket: ${userBucket.user.username}`);
            }

            if (userBucket) {
                const bucketIndex = BUCKETS_DB.findIndex(b => b.user.id === userBucket?.user.id);
                if (bucketIndex !== -1) {
                    BUCKETS_DB[bucketIndex] = userBucket;
                    logger.info(`Bucket updated in BUCKETS_DB for user: ${userBucket.user.username}`);
                }
            }

            userBucket.serviceStarted = true;
            this.startTokenAddition(userBucket);
            logger.info(`Token service started for user: ${userBucket.user.username} with ${userBucket.tokens.length} tokens`);
        } else if (userBucket) {
            logger.warn(`Token service already started for user: ${userBucket.user.username}`);
        }
    }

    static createBucket(user: IAuthUser): Bucket {
        logger.info(`Checking if bucket exists for user: ${user.id}`);

        let bucket = BUCKETS_DB.find(b => b.user.id === user.id);

        if (!bucket) {
            logger.info(`No existing bucket found. Creating new bucket for user: ${user.id}`);
            bucket = new Bucket(user);
            BUCKETS_DB.push(bucket);
            logger.info(`New bucket created for user: ${user.username}`);
            return bucket;

        }

        logger.info(`Existing bucket found for user: ${user.id}`);
        return bucket;
    }

    static getBucketByUserId(userId: string): Bucket | null {
        logger.info(`Retrieving bucket for user: ${userId}`);
        const bucket = BUCKETS_DB.find(b => b.user.id === userId);
        if (!bucket) {
            logger.warn(`No bucket found for user: ${userId}`);
            return null;
        }
        logger.info(`Bucket found for user: ${userId}`);
        return bucket;
    }

    static addToken(token: string, bucket: Bucket): void {
        if (bucket.tokens.length >= MAX_TOKENS) {
            logger.warn(`Cannot add token for user: ${bucket.user.id}, bucket already full`);
            return;
        }
        bucket.tokens.push(token);
        logger.info(`Added new token for user: ${bucket.user.id}, tokens count: ${bucket.tokens.length}`);
    }

    static getTokenToConsume( bucket: Bucket): string  {
        const token = bucket.tokens[0]
        if (!token) {
            throw new TokenNotFound()
        }
        logger.info(`Token to consume succefully retrieved for user ${bucket.user.id}`);
        return token
        
    }
    

    static checkBucket({ bucket }: { bucket: Bucket}): boolean {
        logger.info(`Checking if user token is in user bucket: ${bucket.user.id}`);

        if (bucket.tokens.length === 0) {
            logger.warn(`Bucket is empty. No valid tokens available for user: ${bucket.user.id}`);
            throw new NoValidTokens();
        }
        logger.info(`User bucket contains valid tokens`);

        return true;
    }

    static consumeToken({ bucket, token }: { bucket: Bucket, token: string }): boolean  {
        const tokenToConsume = bucket.tokens.find(t => t === token);

        if (!tokenToConsume) {
            logger.warn(`Token not found for user: ${bucket.user.id}`);
            throw new TokenNotFound();
        }
    
        const tokenIndex = bucket.tokens.indexOf(tokenToConsume);
        if (tokenIndex !== -1) {
            bucket.tokens.splice(tokenIndex, 1);
        }
    
        AuthService.revokeToken(tokenToConsume);
        logger.info(`Token consumed for user: ${bucket.user.id}, tokens left: ${bucket.tokens.length}`);
        return true;
    }

    static getTokenCount(bucket: Bucket): number {
        logger.info(`Getting token count for user: ${bucket.user.id}, tokens count: ${bucket.tokens.length}`);
        return bucket.tokens.length;
    }

    static startTokenAddition(bucket: Bucket) {
        logger.info(`Starting token addition interval for user: ${bucket.user.id}`);
        bucket.intervalId = setInterval(() => {
            const token = AuthService.generateToken(bucket.user);
            this.addToken(token, bucket);
        }, TOKENS_INTERVAL);
    }

    static stopTokenAddition(bucket: Bucket) {
        if (!bucket.intervalId) {
            logger.warn(`No token addition interval found to stop for user: ${bucket.user.id}`);
            return;
        }
        clearInterval(bucket.intervalId);
        logger.info(`Token addition interval stopped for user: ${bucket.user.id}`);
    }
}
