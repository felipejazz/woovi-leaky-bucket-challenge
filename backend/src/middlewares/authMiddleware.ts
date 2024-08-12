import {Context, Next} from 'koa';
import jwt from 'jsonwebtoken';

export const authMiddleware = async(ctx: Context, next: Next) => {
    const authHeader = ctx.header.authorization;
    
    if (!authHeader) {
        ctx.status = 403;
        ctx.body = { message: 'No token provided'};
        return
    }
    const token = authHeader.split(' ')[1]

    try {
        ctx.state.user = jwt.verify(token, process.env.SECRET_KEY || 'woovi-challenge-secret')
        await next()
    } catch (err) {
        ctx.status = 401;
        ctx.body = { message: 'Unauthorized'}
    }
}