import request from 'supertest';
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import { PixController } from '../src/controllers/PixController';
import { BucketService } from '../src/services/BucketService';
import { AuthService } from '../src/services/AuthService';
import { NoValidTokens } from '../src/interfaces/Bucket/Errors';

jest.mock('../src/services/BucketService');
jest.mock('../src/services/AuthService');

describe('PixController.simulatePixQuery', () => {
    let app: Koa;
    let router: Router;

    const user = {
        id: 'user-id',
        username: 'testuser',
        token: 'valid-token'
    };

    beforeEach(() => {
        app = new Koa();
        router = new Router();

        (AuthService.getUserById as jest.Mock).mockReturnValue(user);

        (BucketService.getBucketByUserId as jest.Mock).mockReturnValue({
            user: user,
            tokens: ['valid-token'],
            serviceStarted: true,
        });

        (BucketService.getTokenCount as jest.Mock).mockReturnValue(10);
        (BucketService.checkBucket as jest.Mock).mockImplementation(() => true);
        (BucketService.getTokenToConsume as jest.Mock).mockReturnValue('valid-token');
        (BucketService.consumeToken as jest.Mock).mockImplementation(() => true);

        router.post('/pix/query', async (ctx, next) => {
            ctx.state.user = user;
            await next();
        }, PixController.simulatePixQuery);

        app.use(bodyParser());
        app.use(router.routes()).use(router.allowedMethods());

        jest.clearAllMocks();
    });

    it('should successfully simulate a Pix query when bucket has maximum tokens', async () => {
        const response = await request(app.callback())
            .post('/pix/query')
            .send({ key: 'validemail@example.com', value: 100 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'Pix query success',
            tokensLeft: 10,
        });

        expect(BucketService.getTokenCount).toHaveBeenCalled();
        expect(BucketService.consumeToken).not.toHaveBeenCalled();
    });

    it('should return 429 if all tokens are consumed', async () => {
        (BucketService.getTokenCount as jest.Mock).mockReturnValue(0);
        (BucketService.checkBucket as jest.Mock).mockImplementation(() => {
            throw new NoValidTokens();
        });

        const response = await request(app.callback())
            .post('/pix/query')
            .send({ key: 'validemail@example.com', value: 100 });

        expect(response.status).toBe(429);
        expect(response.body).toEqual({
            message: 'Too many requests',
            tokensLeft: 0,
        });

        expect(BucketService.consumeToken).toHaveBeenCalled();
    });

    it('should return 400 for invalid Pix key format', async () => {
        (BucketService.getTokenCount as jest.Mock).mockReturnValue(9);
        const response = await request(app.callback())
            .post('/pix/query')
            .send({ key: 'invalid-key', value: 100 });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Invalid PIX KEY FORMAT. Allowed format: email@example.om or telephone \"+5511999999999\"',
            tokensLeft: 9
        });

        expect(BucketService.consumeToken).toHaveBeenCalled();
    });

    it('should return 400 for invalid transfer value', async () => {
        (BucketService.getTokenCount as jest.Mock).mockReturnValue(9);

        const response = await request(app.callback())
            .post('/pix/query')
            .send({ key: 'validemail@example.com', value: -10 });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Invalid PIX VALUE. only positives values are allowed.',
            tokensLeft: 9
        });

        expect(BucketService.consumeToken).toHaveBeenCalled();
    });

    it('should return 400 for invalid transfer value with non-numeric value', async () => {
        (BucketService.getTokenCount as jest.Mock).mockReturnValue(9);

        const response = await request(app.callback())
            .post('/pix/query')
            .send({ key: 'validemail@example.com', value: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Invalid PIX VALUE. only positives values are allowed.',
            tokensLeft: 9
        });

        expect(BucketService.consumeToken).toHaveBeenCalled();
    });
});
