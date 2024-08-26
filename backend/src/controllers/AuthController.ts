import bcrypt from 'bcrypt';
import { Context } from 'koa';
import { UserService } from '../services/UserService';
import { IAuthRequestBody } from '../interfaces/Auth/IAuthRequestBody';
import { BucketService } from '../services/BucketService';
import createCustomLogger from '../utils/logger';

const logger = createCustomLogger('auth-controller');
const SALT_ROUNDS = 10;

export class AuthController {
  static async register(ctx: Context): Promise<void> {
    const { userName, password } = ctx.request.body as IAuthRequestBody;

    logger.info(`Attempting to register user: ${userName}`);

    const existingUserResult = await UserService.getUser(userName);
    if (existingUserResult.success) {
      logger.warn(`Registration failed: Username already exists - ${userName}`);
      ctx.status = 400;
      ctx.body = { errorMessage: 'Username already exists' };
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const token = UserService.generateToken(userName);

    const registeringAuthUser = { userName, password: hashedPassword, token };
    const createUserResult = await UserService.createUser(registeringAuthUser);

    if (!createUserResult.success) {
      logger.error(`Error registering user: ${createUserResult.error}`);
      ctx.status = 500;
      ctx.body = { errorMessage: 'Internal server error' };
      return;
    }

    logger.info(`User registered successfully: ${userName}`);

    ctx.status = 201;
    ctx.body = { successMessage: 'User registered successfully' };
  }

  static async login(ctx: Context): Promise<void> {
    const { userName, password } = ctx.request.body as IAuthRequestBody;

    logger.info(`Attempting login for user: ${userName}`);

    const userResult = await UserService.getUser(userName);
    if (!userResult.success) {
      logger.warn(`Login failed for user: ${userName} - User not found`);
      ctx.status = 401;
      ctx.body = { message: 'User not found' };
      return;
    }

    const user = userResult.data;

    if (!user) {
      logger.warn(`Login failed for user: ${userName} - INTERNAL ERROR`);
      ctx.status = 500;
      ctx.body = { message: 'INTERNAL GET USER MONGO ERROR' };
      return;
    }

    const isPasswordValid = user.password
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!isPasswordValid) {
      logger.warn(`Login failed for user: ${userName} - Invalid credentials`);
      ctx.status = 401;
      ctx.body = { message: 'Invalid credentials' };
      return;
    }

    const token = UserService.generateToken(userName);
    user.token = token;

    const updateUserResult = await UserService.updateUser(user);

    if (!updateUserResult.success) {
      logger.warn(
        `Login failed for user: ${userName} - ${updateUserResult.error}`
      );
      ctx.status = 401;
      ctx.body = { message: updateUserResult.error };
      return;
    }

    const userCreated = updateUserResult.data;
    if (!userCreated) {
      logger.warn(
        `Login failed for user: ${userName} - Fail retrieving updated user`
      );
      ctx.status = 401;
      ctx.body = { message: 'Fail retrieving updated user' };
      return;
    }

    const userCreatedBucketResult =
      await BucketService.createBucket(userCreated);
    if (!userCreatedBucketResult.success) {
      logger.warn(
        `Login failed for user: ${userName} - Failed to create bucket`
      );
      ctx.status = 500;
      ctx.body = { message: userCreatedBucketResult.error };
      return;
    }

    const userBucket = userCreatedBucketResult.data;
    if (!userBucket) {
      logger.warn(
        `Login failed for user: ${userName} - Failed to create bucket`
      );
      ctx.status = 500;
      ctx.body = { message: userCreatedBucketResult.error };
      return;
    }

    const fillBucketResult = await BucketService.fillBucket({
      bucket: userBucket,
      initialToken: token,
    });
    if (!fillBucketResult.success) {
      logger.warn(`Login failed for user: ${userName} - Failed to fill bucket`);
      ctx.status = 500;
      ctx.body = { message: fillBucketResult.error };
      return;
    }

    logger.info(`User logged in successfully: ${userName}`);

    ctx.body = { token };
  }
}
