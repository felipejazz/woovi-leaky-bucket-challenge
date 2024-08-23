import Redis from 'ioredis';
import createCustomLogger from '../utils/logger';

const logger = createCustomLogger('redis-service');

class RedisService {
    private static instanceCount = 0;
    private static instance: RedisService;
    public redis: Redis;

    private constructor() {
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
        const redisPassword = process.env.REDIS_PASSWORD || '';

        this.redis = new Redis({
            host: redisHost,
            port: redisPort,
            password: redisPassword || undefined,
            maxRetriesPerRequest: null,
            retryStrategy(times) {
                return Math.min(times * 50, 2000);
            },
        });

        RedisService.instanceCount++;
        logger.info(`Redis instance created. Total instances: ${RedisService.instanceCount}`);
    }

    static async acquireLock(key: string, timeout: number): Promise<boolean> {
        const redisInstance = RedisService.getInstance().redis;
        const result = await redisInstance.set(key, 'locked', 'PX', timeout, 'NX');
        return result === 'OK';
    }

    static async releaseLock(key: string): Promise<void> {
        const redisInstance = RedisService.getInstance().redis;
        await redisInstance.del(key);
    }

    static getInstanceCount(): number {
        return RedisService.instanceCount;
    }

    static async teardown(): Promise<void> {
        const redisInstance = RedisService.getInstance().redis;
        await new Promise<void>((resolve) => {
            redisInstance.quit();
            redisInstance.on('end', resolve);
        });
        RedisService.instanceCount--;
        logger.info(`Redis instance closed. Remaining instances: ${RedisService.instanceCount}`);
    }

    static getInstance(): RedisService {
        if (!RedisService.instance) {
            throw new Error('RedisService is not initialized. Call initialize() first.');
        }
        return RedisService.instance;
    }

    static async initialize(): Promise<RedisService> {
        logger.info('Initializing RedisService...');
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
            await RedisService.instance.redis.ping();
            logger.info('Redis ping successful, ready to proceed.');
        }
        logger.info('RedisService initialized successfully.');
        return RedisService.instance;
    }
}

export default RedisService;
