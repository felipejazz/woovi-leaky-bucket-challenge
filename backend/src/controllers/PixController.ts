import { Context } from 'koa';
import { PixService } from '../services/PixService';
import createCustomLogger from '../utils/logger';
import { AuthService } from '../services/AuthService';
import { NoValidTokens, TokenNotFound } from '../interfaces/Bucket/Errors';
import { BucketService } from '../services/BucketService';
import { InvalidPixKeyError, InvalidPixValueError } from '../interfaces/Pix/Errors';
import { IAuthUser } from '../interfaces/User/IAuthUser';

const logger = createCustomLogger('pix-controller');

export class PixController {
    static async simulatePixQuery(ctx: Context) {
        let user;
        let bucket;
        let tokenToConsume;

        try {
            const userId = ctx.state.user.id;
            user = AuthService.getUserById(userId);
            if (!user) throw new Error('User not found');

            bucket = BucketService.getBucketByUserId(user.id);
            if (!bucket) throw new Error('Bucket not found');

            tokenToConsume = BucketService.getTokenToConsume(bucket);
            
            const { key, value } = ctx.request.body as { key: string, value: number };
            
            PixService.makePix({ userId, key, value, token: tokenToConsume });
            ctx.status = 200;
            ctx.body = {
                successMessage: 'Pix query success',
                tokensLeft: BucketService.getTokenCount(bucket),
            };
        } catch (error) {
            if (bucket && user && tokenToConsume) {
                BucketService.consumeToken({ bucket, token: tokenToConsume });
                const tokensLeft = BucketService.getTokenCount(bucket)
                PixController.handleError(ctx, error, user.id, tokensLeft)
                return
            }
            if (bucket && user && !tokenToConsume) {
                PixController.handleError(ctx, new NoValidTokens(), user.id, 0)
                return
            }
            PixController.handleError(ctx, new NoValidTokens(), ctx.user.id, 0)

        }
    }

    static handleError(ctx: Context, error: any, userId:string| IAuthUser, tokensLeft: number): void {

        switch (error.constructor) {
            case NoValidTokens:
                logger.warn(`Error during Pix query for user: ${userId}, error: ${error.message}`);
                ctx.status = 429;
                ctx.body = { errorMessage: 'Too many requests', tokensLeft };
                break;

            case TokenNotFound:
                logger.error(`Token not found in user bucket: ${userId}`);
                ctx.status = 400;
                ctx.body = { errorMessage: error.message, tokensLeft };
                break;

            case InvalidPixKeyError:
                logger.error(`Error during Pix query for user: ${userId}, error: Invalid PIX key`);
                ctx.status = 400;
                ctx.body = { errorMessage: error.message, tokensLeft };
                break;

            case InvalidPixValueError:
                logger.error(`Error during Pix query for user: ${userId}, error: Invalid PIX value`);
                ctx.status = 400;
                ctx.body = { errorMessage: error.message, tokensLeft };
                break;

            default:
                logger.error(`Unknown error during Pix query for user: ${userId}`);
                ctx.status = 500;
                ctx.body = { errorMessage: 'An unexpected error occurred' };
                break;
        }
    }
}
