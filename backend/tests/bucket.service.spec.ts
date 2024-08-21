import { BucketService } from '../src/services/BucketService';
import { AuthService } from '../src/services/AuthService';
import { AuthUser } from '../src/models/AuthUser';
import { UserModel } from '../src/models/mongoose/UserModel';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { IDocumentBucket } from '../src/interfaces/Bucket/IDocumentBucket';
import { BucketFullError, BucketNoValidTokensError, BucketTokenNotFoundError, NoTokenToConsumeError } from '../src/interfaces/Bucket/Errors';
import { IDocumentAuthUser } from '../src/interfaces/User/IDocumentAuthUser';
import RedisService from '../src/services/RedisService';


describe('BucketService', () => {
    const username =  'testuser'; 
    const password =  'testpassword';
    let mongoServer: MongoMemoryReplSet;
    let testUser: AuthUser
    let createdTestUser: IDocumentAuthUser

    beforeAll(async () => {
        mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        

    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
        const token = AuthService.generateToken(username);

        testUser = new AuthUser({
            userName: username,
            password: password,
            token: token,
        });

        const createUserResult = await AuthService.createUser(testUser);
        if (!createUserResult.success) {
            throw createUserResult.error;
        }
        if(!createUserResult.data){
            throw Error('Error unpacking user before test')
        }
        createdTestUser = createUserResult.data
        if(!createdTestUser) {
            throw Error('Error creating user before test')
        }
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        // await redisService.teardown();
        
    });
    afterEach(async () => {
        // await redisService.redis.flushall();
        await UserModel.deleteMany({});
        
    });
        
    it('should create a bucket', async () => {

        const bucketCreateResult = await BucketService.createBucket(createdTestUser);
        if (!bucketCreateResult.success) {
            throw bucketCreateResult.error
        }
        expect(bucketCreateResult.success).toBe(true);
    });

    it('should update the bucket', async () => {
        const bucketCreateResult = await BucketService.createBucket(createdTestUser);
        if (!bucketCreateResult.success) {
            throw bucketCreateResult.error
        }
        
        const bucketGetResult = await BucketService.getBucket(createdTestUser.userName);
        if (!bucketGetResult.success) {
            throw bucketGetResult.error;
        }
        if (!bucketGetResult.data) {
            throw new Error("Error retrieving bucket data")
        }
        const now = new Date();
        const testBucket = bucketGetResult.data
        testBucket.lastTimeStamp = now
        const updateResult = await BucketService.updateBucket(testBucket);
        if (!updateResult.success) {
            throw new Error('Error updating bucket during test');
        }

        const updatedBucket = updateResult.data as IDocumentBucket;
        expect(updatedBucket.lastTimeStamp).toEqual(now);
    });

    it('should add a token to the bucket', async () => {
        const token: string = AuthService.generateToken(createdTestUser.userName);
        const bucketCreateResult = await BucketService.createBucket(createdTestUser);
        if (!bucketCreateResult.success) {
            throw bucketCreateResult.error
        }
        const bucket = bucketCreateResult.data as IDocumentBucket

        await BucketService.addToken({token:token, bucket:bucket});
        const bucketCountResult = await BucketService.getTokenCount(createdTestUser)
        if (!bucketCountResult.success){
            throw bucketCountResult.error
        }
        expect(bucketCountResult.data).toBe(1);
    });

    it('should throw BucketNoValidTokensError error when trying to check for a token from an empty bucket', async () => {
        const bucketCreateResult = await BucketService.createBucket(createdTestUser);
        if (!bucketCreateResult.success) {
            throw bucketCreateResult.error;
        }
    
        const bucketGetResult = await BucketService.getBucket(createdTestUser.userName);
        if (!bucketGetResult.success) {
            throw bucketGetResult.error;
        }
        if (!bucketGetResult.data) {
            throw new Error("Error retrieving bucket data");
        }
    
        const bucket = bucketGetResult.data as IDocumentBucket;
        bucket.tokens = []; 
        const updateResult = await BucketService.updateBucket(bucket); 
        if (!updateResult.success) {
            throw new Error('Error updating bucket after clearing tokens');
        }
    
        const checkResult = await BucketService.checkBucket(bucket);
        if (!checkResult) {
            throw new Error("Error checking bucket");
        }
        const error = checkResult.error;
        if (!error) {
            console.log(checkResult.success);
            throw new Error("Error not found");
        }
        expect(error).toBeInstanceOf(BucketNoValidTokensError);
    });
    it('should throw NoTokenToConsumeError when the bucket has no validTokensToConsume', async () => {
        const bucketCreateResult = await BucketService.createBucket(createdTestUser);
        if (!bucketCreateResult.success) {
            throw bucketCreateResult.error
        }
        const bucket = bucketCreateResult.data as IDocumentBucket
        const checkResult = await BucketService.getTokenToConsume(createdTestUser)
        
        if (!checkResult) {
            throw new Error("Error checking bucket")
        }
        const error = checkResult.error
        if(!error) {
            throw new Error("Error not found ")
        }

        expect(error).toBeInstanceOf(NoTokenToConsumeError)

    });

    it('should consume a token from the bucket', async () => {
        const token: string = AuthService.generateToken(createdTestUser.userName);
        const bucketCreateResult = await BucketService.createBucket(createdTestUser);
        if (!bucketCreateResult.success) {
            throw bucketCreateResult.error
        }
        const bucket = bucketCreateResult.data as IDocumentBucket
    
        const updatedBucketResult = await BucketService.addToken({token:token, bucket:bucket});
        if (!updatedBucketResult) {
            throw new Error('Fail when try to add token')
        }

        if(!updatedBucketResult.success){
            throw updatedBucketResult.error
        }

        const updatedBucket = updatedBucketResult.data
        if (!updatedBucket) {
            throw new Error('Fail unpacking update bucket obj')
        }

        const bucketCountResult = await BucketService.getTokenCount(createdTestUser)
        if (!bucketCountResult) {
            throw new Error ('Fail while try to get token count')
        }

        if (!bucketCountResult.data){
            throw bucketCountResult.error
        }

        const bucketCount = bucketCountResult.data
        const consumeTokenResult = await BucketService.consumeToken(createdTestUser);

        if (!consumeTokenResult) {
            throw new Error("Error while call consume token method")
        }
        expect(consumeTokenResult.success).toBe(true);
    });
    it('should not allow more than 10 tokens', async () => {
        const bucketCreateResult = await BucketService.createBucket(createdTestUser);
        if (!bucketCreateResult.success) {
            throw bucketCreateResult.error
        }
        
        const bucketGetResult = await BucketService.getBucket(createdTestUser.userName);
        if (!bucketGetResult.success) {
            throw bucketGetResult.error;
        }
        if (!bucketGetResult.data) {
            throw new Error("Error retrieving bucket data")
        }
        const testBucket = bucketGetResult.data
        let bucketDocumentToAdd = testBucket
        for (let i = testBucket.tokens.length; i < 10; i++) {
            const token: string = AuthService.generateToken(createdTestUser.userName);
            const additionResult = await BucketService.addToken({token: token, bucket: testBucket});
            if (!additionResult){
                throw new Error('Error during adition')
            }
            if (!additionResult.data){
                throw additionResult.error
            }
            bucketDocumentToAdd = additionResult.data
        }

        const extraToken: string = AuthService.generateToken(createdTestUser.userName);
        const addExtraTokenResult = await BucketService.addToken({token: extraToken, bucket: testBucket});

        expect(addExtraTokenResult.success).toBe(false)
        expect(addExtraTokenResult.error).toBeInstanceOf(BucketFullError)
        
    });

    it('should add a token after 1 hour and 2 tokens after 2 hours', async () => {
        const initialBucketCreateResult = await BucketService.createBucket(createdTestUser);
        if (!initialBucketCreateResult.success) {
            throw initialBucketCreateResult.error;
        }

        const initialBucketGetResult = await BucketService.getBucket(createdTestUser.userName);
        if (!initialBucketGetResult.success) {
            throw initialBucketGetResult.error;
        }
        

        let initialBucket = initialBucketGetResult.data as IDocumentBucket;
        initialBucket.tokens = []
        const bucketGetResult = await BucketService.getBucket(createdTestUser.userName);
        if (!bucketGetResult.success) {
            throw bucketGetResult.error;
        }
        if (!bucketGetResult.data) {
            throw new Error("Error retrieving bucket data");
        }
    
        const bucket = bucketGetResult.data as IDocumentBucket;
        bucket.tokens = []; 
        const updateResult = await BucketService.updateBucket(bucket); 
        if (!updateResult.success) {
            throw updateResult.error
        }
        if (!updateResult.data) {
            throw new Error('Error unpacking update bucket after clearing tokens');
        }

        const bucketToTest = updateResult.data; 
        expect(bucketToTest.tokens.length).toBe(0);

        bucketToTest.lastTimeStamp = new Date(Date.now() - 3600000); 
        const updateBucketResult = await BucketService.updateBucket(bucketToTest);
        if (!updateBucketResult.success) {
            throw new Error('Error updating bucket during test');
        }

        const bucketGetResultAfter1Hour = await BucketService.getBucket(createdTestUser.userName);
        if (!bucketGetResultAfter1Hour.success) {
            throw bucketGetResultAfter1Hour.error;
        }

        const bucketAfter1Hour = bucketGetResultAfter1Hour.data as IDocumentBucket;
        expect(bucketAfter1Hour.tokens.length).toBe(1);

        bucketAfter1Hour.lastTimeStamp = new Date(Date.now() - 7200000);
        const updateBucketResultAfter2Hours = await BucketService.updateBucket(bucketAfter1Hour);
        if (!updateBucketResultAfter2Hours.success) {
            throw new Error('Error updating bucket during test');
        }

        const bucketGetResultAfter2Hours = await BucketService.getBucket(createdTestUser.userName);
        if (!bucketGetResultAfter2Hours.success) {
            throw bucketGetResultAfter2Hours.error;
        }

        const bucketAfter2Hours = bucketGetResultAfter2Hours.data as IDocumentBucket;
        expect(bucketAfter2Hours.tokens.length).toBe(3);
    });
});
