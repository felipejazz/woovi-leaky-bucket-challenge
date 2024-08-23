import Redis from "ioredis";
import RedisService from "../src/services/RedisService";

describe('RedisService', () => {
    let redisClient: Redis;

    beforeAll(async () => {
        await RedisService.initialize();
        redisClient = RedisService.getInstance().redis;
    });

    afterAll(async () => {
        await RedisService.teardown();
    });

    test('should connect to Redis', async () => {
        const pong = await redisClient.ping();
        expect(pong).toBe('PONG');
    });

    test('should acquire and release a lock', async () => {
        const key = 'test-lock';
        const timeout = 1000;

        const lockAcquired = await RedisService.acquireLock(key, timeout);
        expect(lockAcquired).toBe(true);

        const lockAcquiredAgain = await RedisService.acquireLock(key, timeout);
        expect(lockAcquiredAgain).toBe(false);

        await RedisService.releaseLock(key);

        const lockAcquiredAfterRelease = await RedisService.acquireLock(key, timeout);
        expect(lockAcquiredAfterRelease).toBe(true);

        await RedisService.releaseLock(key);
    });
});
