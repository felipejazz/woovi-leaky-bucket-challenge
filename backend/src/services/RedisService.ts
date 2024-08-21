import Redis from 'ioredis';
import createCustomLogger from '../utils/logger';
const logger = createCustomLogger('redis-service');

class RedisService {
    private static instanceCount = 0;
    private static instance: RedisService;
    public redis: Redis;


    constructor() {
        this.redis = new Redis({
            host: 'localhost',
            port: 6379,
            maxRetriesPerRequest: null
        });
        RedisService.instanceCount++;
        logger.info(`Redis instance created. Total instances: ${RedisService.instanceCount}`);
        // console.log(new Error().stack); uncomment to track where redis were been created
    }

    async acquireLock(key: string, timeout: number): Promise<boolean> {
        const result = await this.redis.set(key, 'locked', 'PX', timeout, 'NX');
        return result === 'OK';
    }

    async releaseLock(key: string): Promise<void> {
        await this.redis.del(key);
    }

    static getInstanceCount(): number {
        return RedisService.instanceCount;
    }

    async teardown(): Promise<void> {
        await new Promise<void>((resolve) => {
            this.redis.quit();
            this.redis.on('end', resolve);
        });
        RedisService.instanceCount--;
        logger.info(`Redis instance closed. Remaining instances: ${RedisService.instanceCount}`);
    }

    static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
}

export default RedisService.getInstance();
