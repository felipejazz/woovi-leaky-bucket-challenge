import { Context, Next } from 'koa';
import { AuthService } from '../services/AuthService';
import jwt from 'jsonwebtoken';
import { IDecodedJWT } from '../interfaces/IDecodedJWT';
import createCustomLogger from '../utils/logger';
import { BucketService } from '../services/BucketService';

const logger = createCustomLogger('authmiddleware');

export const authMiddleware = async (ctx: Context, next: Next) => {
    const authHeader = ctx.header.authorization;

    if (!authHeader) {
        ctx.status = 403;
        ctx.body = { message: 'No token provided' };
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = jwt.verify(token, process.env.SECRET_KEY || 'woovi-challenge-secret') as IDecodedJWT;

        if (!decodedToken || !decodedToken.user) {
            ctx.status = 401;
            ctx.body = { message: 'Invalid token' };
            return;
        }

        const userResult = await AuthService.getUser(decodedToken.user);
        if (!userResult.success || !userResult.data) {
            ctx.status = 401;
            ctx.body = { message: 'Unauthorized' };
            return;
        }
        const user = userResult.data;

        if (user.noValidTokens){

            ctx.status = 429;
            ctx.body = { errorMessage: 'Too many requests'};
            return
                
        }
        ctx.state.user = user
        await next();
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error.message)
        }
        ctx.status = 401;
        ctx.body = { message: 'Unauthorized' };
    }
};
