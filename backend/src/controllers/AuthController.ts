import { Context } from 'koa';
import { AuthService } from '../services/AuthService';
import { AuthUser } from '../models/AuthUser';
import { v4 as uuidv4 } from 'uuid';
import { IAuthRequestBody } from '../interfaces/Auth/IAuthRequestBody';
import { BucketService } from '../services/BucketService';
import createCustomLogger from '../utils/logger';
import { User } from '../models/User';

const logger = createCustomLogger('auth-controller');

export class AuthController {

    static async register(ctx: Context): Promise<void> {
        const { username, password } = ctx.request.body as IAuthRequestBody;

        logger.info(`Attempting to register user: ${username}`);
        let user = AuthService.getUserByName(username);

        if (user) {
            logger.warn(`Registration failed: Username already exists - ${username}`);
            ctx.status = 400;
            ctx.body = { errorMessage: 'Username already exists' } as { errorMessage: string };
            return;
        }

        const id = uuidv4();
        const registeringUser = new User({id, username, password}); 
        const token = AuthService.generateToken(registeringUser);
        const newUser = new AuthUser({id, username, password, token});
        AuthService.createUser(newUser);

        logger.info(`User registered successfully: ${username}`);

        ctx.status = 201;
        ctx.body = { successMessage: 'User registered successfully' } as { successMessage: string};
    }

    static async login(ctx: Context): Promise<void> {
        const { username, password } = ctx.request.body as IAuthRequestBody;

        logger.info(`Attempting login for user: ${username}`);

        const user = AuthService.getUserByName(username);

        if (!user || user.password !== password) {
            logger.warn(`Login failed for user: ${username} - Invalid credentials`);
            ctx.status = 401;
            ctx.body = { message: 'Invalid credentials' } as { message: string };
            return;
        }

        const token = AuthService.generateToken(user);
        AuthService.updateUser(user.id, { token });
        BucketService.startService(user.bucket);
        logger.info(`User logged in successfully: ${username}`);

        ctx.body = { token } as { token: string };
    }

    static async logout(ctx: Context): Promise<void> {
        const token = ctx.headers.authorization?.split(' ')[1];

        if (!token) {
            logger.warn('Logout failed: No token provided');
            ctx.status = 400;
            ctx.body = { message: 'Token is required' } as { message: string };
            return;
        }

        logger.info('Attempting logout');

        const jwtObj = AuthService.verifyToken(token);
        const user = AuthService.getUserById(jwtObj.id);

        if (!user) {
            logger.warn('Logout attempted with invalid token, user not found');
            return;
        }

        user.bucket.tokens.forEach(token => {
            AuthService.revokeToken(token);
        });

        BucketService.stopTokenAddition(user.bucket);
        logger.info(`User logged out successfully: ${user.username}`);

        ctx.status = 200;
        ctx.body = { message: 'Logout successful, all tokens revoked' } as { message: string };
    }

}
