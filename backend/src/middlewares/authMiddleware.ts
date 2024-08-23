import { Context, Next } from 'koa';
import { UserService } from '../services/UserService';
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
        const userResult = await UserService.getUser(decodedToken.user);
        if (!userResult.success || !userResult.data) {

            ctx.status = 401;
            ctx.body = { errorMessage: 'Unauthorized' };
            return;
        }
        
        const user = userResult.data;
        ctx.state.user = user
        ctx.state.token = token
        await next();
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error.message)
        }
        ctx.status = 401;
        ctx.body = { message: 'Unauthorized' };
    }
};
