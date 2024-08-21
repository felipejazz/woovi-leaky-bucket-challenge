import { Context } from 'koa';
import { AuthService } from '../services/AuthService';
import { AuthUser } from '../models/AuthUser';
import { IAuthRequestBody } from '../interfaces/Auth/IAuthRequestBody';
import { BucketService } from '../services/BucketService';
import createCustomLogger from '../utils/logger';

const logger = createCustomLogger('auth-controller');

export class AuthController {
    static async register(ctx: Context): Promise<void> {
        const { userName, password } = ctx.request.body as IAuthRequestBody;

        logger.info(`Attempting to register user: ${userName}`);


        const existingUserResult = await AuthService.getUser(userName);

        if (existingUserResult.success) {
            logger.warn(`Registration failed: Username already exists - ${userName}`);
            ctx.status = 400;
            ctx.body = { errorMessage: 'Username already exists' };
            return;
        }

    
        const token = AuthService.generateToken(userName);

        const registeringAuthUser = new AuthUser({userName, password, token})
        const createUserResult = await AuthService.createUser(registeringAuthUser);

        if (!createUserResult.success) {
            logger.error(`Error registering user: ${createUserResult.error}`);
            ctx.status = 500;
            ctx.body = { errorMessage: 'Internal server error' };
        }

        logger.info(`User registered successfully: ${userName}`);

        ctx.status = 201;
        ctx.body = { successMessage: 'User registered successfully' };
    }

    static async login(ctx: Context): Promise<void> {
        const { userName, password } = ctx.request.body as IAuthRequestBody;

        logger.info(`Attempting login for user: ${userName}`);

        const userResult = await AuthService.getUser(userName);
        if (!userResult.success) {
            logger.warn(`Login failed for user: ${userName} - User not found`);
            ctx.status = 401;
            ctx.body = { message: 'User not found' };
        }
        const user = userResult.data

        if (!user) {
            logger.warn(`Login failed for user: ${userName} - INTERNAL ERROR`);
            ctx.status = 500;
            ctx.body = { message: 'INTERNAL GET USER MONGO ERROR' };
            return;
        }

        if (user.password !== password) {
            logger.warn(`Login failed for user: ${userName} - Invalid credentials`);
            ctx.status = 401;
            ctx.body = { message: 'Invalid credentials' };
            return;
        }

        const token = AuthService.generateToken(userName);
        user.token = token

        const updateUserResult = await AuthService.updateUser(user);

        if (!updateUserResult.success) {
            logger.warn(`Login failed for user: ${userName} - ${updateUserResult.error}`);
            ctx.status = 401;
            ctx.body = { message: updateUserResult.error };
            return;
        }

        const userCreated = updateUserResult.data
        if (!userCreated) {
            logger.warn(`Login failed for user: ${userName} - Fail retrieving updated user`);
            ctx.status = 401;
            ctx.body = { message: 'Fail retrieving updated user' };
            return;

        }
        const userCreatedBucketResult = await BucketService.createBucket(userCreated)
        if (!userCreatedBucketResult.success) {
            logger.warn(`Login failed for user: ${userName} - Failed to create bucket`);
            ctx.status = 500;
            ctx.body = { message: userCreatedBucketResult.error };
            return;
        }

        const userWithBucket = userCreatedBucketResult.data
        if (!userWithBucket) {
            logger.warn(`Login failed for user: ${userName} - Failed to create bucket`);
            ctx.status = 500;
            ctx.body = { message: userCreatedBucketResult.error };
            return;
        }

        const fillBucketResult = await BucketService.fillBucket(userCreated);
        if (!fillBucketResult.success) {
            logger.warn(`Login failed for user: ${userName} - Failed to fill bucket`);
            ctx.status = 500;
            ctx.body = { message: fillBucketResult.error };
            return;
        }

        logger.info(`User logged in successfully: ${userName}`);

        ctx.body = { token };
        

        logger.info(`User logged in successfully: ${userName}`);

        ctx.body = { token };
        return
    }

    static async logout(ctx: Context): Promise<void> {
        const token = ctx.headers.authorization?.split(' ')[1];

        if (!token) {
            logger.warn('Logout failed: No token provided');
            ctx.status = 400;
            ctx.body = { message: 'Token is required' };
            return;
        }

        logger.info('Attempting logout');

        const getUserResult = await AuthService.getUser(token);

        if(!getUserResult.success) {
            logger.warn('Logout attempted while get user');
            ctx.status = 401;
            ctx.body = { message: getUserResult.error };
            return;
        }
        const userFromDb = getUserResult.data

        if (!userFromDb) {
            logger.warn('Logout attempted with internal error retrieving user');
            ctx.status = 500;
            ctx.body = { message: 'error retrieving user from db'};
            return;
        }


        if (userFromDb.bucket) {
            userFromDb.bucket.tokens.forEach(token => {
                AuthService.revokeToken({user: userFromDb, token});
            });
        }

        logger.info(`User logged out successfully: ${userFromDb.userName}`);

        ctx.status = 200;
        ctx.body = { message: 'Logout successful, all tokens revoked' };
    }
}
