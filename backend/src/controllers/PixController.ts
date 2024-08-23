import { Context } from 'koa';
import { PixService } from '../services/PixService';
import createCustomLogger from '../utils/logger';
import { UserService } from '../services/UserService';
import { BucketNoValidTokensError, BucketRevokeTokenError, NoTokenToConsumeError } from '../interfaces/Bucket/Errors';
import { BucketService } from '../services/BucketService';
import { InvalidPixKeyError, InvalidPixValueError } from '../interfaces/Pix/Errors';
import { IDocumentUser } from '../interfaces/User/IDocumentUser';

const logger = createCustomLogger('pix-controller');

export class PixController {
    static async simulatePixQuery(ctx: Context) {
        const userName = ctx.state.user.userName;
        const token = ctx.state.token

        const userResult = await UserService.getUser(userName);

        if (!userResult || !userResult.success || !userResult.data) {
            const error = new Error('Failed to get user from DB')
            PixController.handleError({ctx,error , userName,tokensLeft: null, newUserToken: null});
            return;
        }

        const bucketResult = await BucketService.getBucket(userName);
        if (!bucketResult || !bucketResult.success || !bucketResult.data) {
            const error = new Error('Fail trying to get user bucket')
            this.handleError({ctx, error, userName, tokensLeft: null, newUserToken: null});
            return;
        }


        const { key, value } = ctx.request.body as { key: string, value: number };

        const makePixResult = await PixService.makePix({ userName, token, key, value });


        const newUserToken = makePixResult.data?.token ?? ctx.state.user.token
        const tokenCount = makePixResult.data?.count ?? null;
        if(tokenCount === null){
            const error = new Error("Fail retrieving user token count")
            PixController.handleError({ctx, error: error, userName, tokensLeft: null, newUserToken: null});
            return

        }
        if(!newUserToken){
            const error = new Error("Fail retrieving user token")
            PixController.handleError({ctx, error: error, userName, tokensLeft: null, newUserToken: null});
            return
        }
        if (!makePixResult.success && makePixResult.error) {
            PixController.handleError({ctx, error: makePixResult.error, userName, tokensLeft: tokenCount, newUserToken:newUserToken});
            return;
        }
        ctx.status = 200;
        ctx.body = {
            successMessage: 'Pix query success',
            tokensLeft: tokenCount !== null && tokenCount !== undefined ? tokenCount : null,
            newToken: newUserToken
        };
    }
    
    static handleError({ctx, error, userName, tokensLeft, newUserToken}:{ctx: Context, error: Error, userName: string | IDocumentUser, tokensLeft: number | null, newUserToken: string | null}): void {

        switch (error.constructor) {
            case NoTokenToConsumeError || BucketNoValidTokensError:
                logger.warn(`Error during Pix query for user: ${userName}, error: ${error.message}`);
                ctx.status = 429;
                ctx.body = { errorMessage: 'Too many requests', tokensLeft: tokensLeft, newUserToken: newUserToken };
                break;
            case BucketRevokeTokenError:
                logger.error(`Error during Pix query for user: ${userName}, error: Token already revoked`);
                ctx.status = 400;
                ctx.body = { errorMessage: error.message, tokensLeft: tokensLeft, newUserToken: newUserToken };
                break;


            case InvalidPixKeyError:
                logger.error(`Error during Pix query for user: ${userName}, error: Invalid PIX key`);
                ctx.status = 400;
                ctx.body = { errorMessage: error.message, tokensLeft: tokensLeft, newUserToken: newUserToken };
                break;

            case InvalidPixValueError:
                logger.error(`Error during Pix query for user: ${userName}, error: Invalid PIX value`);
                ctx.status = 400;
                ctx.body = { errorMessage: error.message, tokensLeft: tokensLeft, newUserToken: newUserToken };
                break;

            default:
                logger.error(`Unknown error during Pix query for user: ${userName}`);
                ctx.status = 500;
                ctx.body = { errorMessage: error.message, tokensLeft: tokensLeft, newUserToken: newUserToken };
                break;
        }
    }
}
