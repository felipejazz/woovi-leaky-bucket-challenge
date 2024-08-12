import { Context } from 'koa';
import { PixService } from '../services/PixService';
import createCustomLogger from '../utils/logger';
import { AuthService } from '../services/AuthService';
import { NoValidTokens, TokenNotFound } from '../interfaces/Bucket/Errors';
import { BucketService } from '../services/BucketService';
import { InvalidPixKeyError, InvalidPixValueError } from '../interfaces/Pix/Errors';

const logger = createCustomLogger('pix-controller');
export class PixController {
    static simulatePixQuery(ctx: Context) {
        let user;
        let bucket;
        let tokenToConsume;

        try {
            const userId = ctx.state.user.id;
            user = AuthService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            bucket = BucketService.getBucketByUserId(user.id);
            if (!bucket) {
                throw new Error('Bucket not found');
            }

            tokenToConsume = BucketService.getTokenToConsume(bucket);
            if (!tokenToConsume) {
                throw new TokenNotFound();
            }

            const { key, value } = ctx.request.body as { key: string, value: number };
            
            PixService.makePix({ userId, key, value, token: tokenToConsume });
            ctx.status = 200;
            const tokensLeft = BucketService.getTokenCount(bucket);
            ctx.body = { message: 'Pix query success', tokensLeft: tokensLeft };
        } catch (error) {
            if (bucket && tokenToConsume) {
                BucketService.consumeToken({ bucket, token: tokenToConsume });
            }

            if (error instanceof NoValidTokens) {
                logger.warn(`Error during Pix query for user: ${user?.username}, error: ${(error as Error).message}`);
                const tokensLeft = bucket ? BucketService.getTokenCount(bucket) : 0;
                ctx.status = 429;
                ctx.body = { message: 'Too many requests', tokensLeft };
            } else if (error instanceof TokenNotFound) {
                const tokensLeft = bucket ? BucketService.getTokenCount(bucket) : 0;
                logger.error(`Error during Pix query for user: ${user?.username}, error: Token not found in user bucket`);
                ctx.status = 400;
                ctx.body = { message: error.message, tokensLeft };
            } else if (error instanceof InvalidPixKeyError) {
                const tokensLeft = bucket ? BucketService.getTokenCount(bucket) : 0;
                logger.error(`Error during Pix query for user: ${user?.username}, error: Invalid PIX key`);
                ctx.status = 400;
                ctx.body = { message: error.message, tokensLeft };
            } else if (error instanceof InvalidPixValueError) {
                const tokensLeft = bucket ? BucketService.getTokenCount(bucket) : 0;
                logger.error(`Error during Pix query for user: ${user?.username}, error: Invalid PIX value`);
                ctx.status = 400;
                ctx.body = { message: error.message, tokensLeft };
            } else {
                logger.error(`Unknown error during Pix query for user: ${user?.id}`);
                ctx.status = 500;
                ctx.body = { message: 'An unexpected error occurred' };
            }
        }
    }
}
