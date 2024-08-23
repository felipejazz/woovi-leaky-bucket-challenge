// import request from 'supertest';
// import Koa from 'koa';
// import bodyParser from 'koa-bodyparser';
// import Router from 'koa-router';
// import mongoose from 'mongoose';
// import { MongoMemoryReplSet } from 'mongodb-memory-server';
// import RedisService from '../src/services/RedisService';
// import { PixController } from '../src/controllers/PixController';
// import { AuthController } from '../src/controllers/AuthController';
// import { PixService } from '../src/services/PixService';
// import { UserModel } from '../src/models/mongoose/UserModel';
// import PixWorker from '../src/workers/PixWorker';
// import { authMiddleware } from '../src/middlewares/authMiddleware';
// import { InvalidPixKeyError, InvalidPixValueError } from '../src/interfaces/Pix/Errors';
// import { BucketService } from '../src/services/BucketService';


// describe('Auth and PixController Integration', () => {
//     let app: Koa;
//     let router: Router;
//     let mongoServer: MongoMemoryReplSet;
//     let pixWorker: PixWorker;
//     let token: string;


//     beforeAll(async () => {
//         mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
//         const uri = mongoServer.getUri();
//         await mongoose.connect(uri);
//         await RedisService.initialize();

//         pixWorker = new PixWorker();

//         app = new Koa();
//         router = new Router();

//         router.post('/auth/register', AuthController.register);
//         router.post('/auth/login', AuthController.login);
//         router.post('/pix/query', authMiddleware, PixController.simulatePixQuery);

//         app.use(bodyParser());
//         app.use(router.routes()).use(router.allowedMethods());
//     });

//     beforeEach(async () => {
//         await UserModel.deleteMany({});
//     });

//     afterAll(async () => {
//         await mongoose.disconnect();
//         await mongoServer.stop();
//         await PixService.closeQueues();
//         await RedisService.teardown(); 
//         await pixWorker.closeWorker();
//     });

//     afterEach(async () => {
//         await UserModel.deleteMany({});
//         await RedisService.getInstance().redis.flushall();
//     });

//     it('should register, login, and successfully simulate a Pix query', async () => {
//         const username = 'testeuserfull';
//         const password = 'testpassword';
    
//         let response = await request(app.callback())
//             .post('/auth/register')
//             .send({ userName: username, password: password });

//         expect(response.status).toBe(201);
//         expect(response.body).toEqual({
//             successMessage: 'User registered successfully',
//         });

//         response = await request(app.callback())
//             .post('/auth/login')
//             .send({ userName: username, password: password });

//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('token');
//         token = response.body.token;


//         response = await request(app.callback())
//             .post('/pix/query')
//             .set('Authorization', `Bearer ${token}`)
//             .send({ key: 'validemail@example.com', value: 100 });

//         expect(response.status).toBe(200);
//         expect(response.body).toEqual({
//             successMessage: 'Pix query success',
//             tokensLeft: 10,
//             newToken : token,
//         });
//     });

//     it('should fail to simulate Pix query due to lack of tokens', async () => {
//         const username = 'testeuserlack';
//         const password = 'testpassword';
//         let response = await request(app.callback())
//             .post('/auth/register')
//             .send({ userName: username, password: password });

//         expect(response.status).toBe(201);
//         expect(response.body).toEqual({
//             successMessage: 'User registered successfully',
//         });

//         response = await request(app.callback())
//             .post('/auth/login')
//             .send({ userName: username, password: password });

//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('token');
//         token = response.body.token;
//         let requestToken = token;
//         for (let i = 1; i < 11; i++) {
//             const innerResponse = await request(app.callback())
//                 .post('/pix/query')
//                 .set('Authorization', `Bearer ${requestToken}`)
//                 .send({ key: 'validemail@example.com', value: -100 });
//             expect(innerResponse.status).toBe(400)
//             expect(innerResponse.body.tokensLeft).toBe(10-i)
//             requestToken = innerResponse.body.newUserToken
//         }

//         response = await request(app.callback())
//             .post('/pix/query')
//             .set('Authorization', `Bearer ${requestToken}`)
//             .send({ key: 'validemail@example.com', value: 100 });

//         expect(response.status).toBe(429);
//         expect(response.body).toEqual({
//             errorMessage: 'Too many requests',
//         });
//     });

//     it('should fail to simulate Pix query due to invalid key', async () => {
//         const username = 'testeuserkey';
//         const password = 'testpassword';

//         let response = await request(app.callback())
//             .post('/auth/register')
//             .send({ userName: username, password: password });

//         expect(response.status).toBe(201);
//         expect(response.body).toEqual({
//             successMessage: 'User registered successfully',
//         });

//         response = await request(app.callback())
//             .post('/auth/login')
//             .send({ userName: username, password: password });

//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('token');
//         token = response.body.token;
//         const userBucketResult = await BucketService.getBucket(username)
//         if(!userBucketResult || !userBucketResult.data){
//             throw new Error('Failed retrieving bucket during test')
//         }
//         const userBucket = userBucketResult.data
//         const nextToken = userBucket.tokens[1]
//         expect(nextToken).not.toEqual(token)

//         response = await request(app.callback())
//             .post('/pix/query')
//             .set('Authorization', `Bearer ${token}`)
//             .send({ key: 'invalid-key', value: 100 });
//         const expectedError = new InvalidPixKeyError()


//         expect(response.status).toBe(400);
//         expect(response.body).toEqual({
//             errorMessage: expectedError.message,
//             tokensLeft: 9,
//             newUserToken: nextToken
//         });
//     });

//     it('should fail to simulate Pix query due to invalid value', async () => {
//         const username = 'testeuservalue';
//         const password = 'testpassword';
//         let response = await request(app.callback())
//             .post('/auth/register')
//             .send({ userName: username, password: password });

//         expect(response.status).toBe(201);
//         expect(response.body).toEqual({
//             successMessage: 'User registered successfully',
//         });

//         response = await request(app.callback())
//             .post('/auth/login')
//             .send({ userName: username, password: password });

//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('token');
//         token = response.body.token;

//         const userBucketResult = await BucketService.getBucket(username)
//         if(!userBucketResult || !userBucketResult.data){
//             throw new Error('Failed retrieving bucket during test')
//         }
//         const userBucket = userBucketResult.data
//         const nextToken = userBucket.tokens[1]
//         expect(nextToken).not.toEqual(token)

//         response = await request(app.callback())
//             .post('/pix/query')
//             .set('Authorization', `Bearer ${token}`)
//             .send({ key: 'validemail@example.com', value: -100 });
        

        
//         const expectedError = new InvalidPixValueError()
//         expect(response.status).toBe(400);
//         expect(response.body).toEqual({
//             errorMessage: expectedError.message,
//             tokensLeft: 9,
//             newUserToken: nextToken
//         });
//     });
// });
