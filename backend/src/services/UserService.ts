import jwt from 'jsonwebtoken';
import createCustomLogger from '../utils/logger';
import { UserModel } from '../models/mongoose/UserModel';
import { Result } from '../models/Result';
import { IDocumentUser } from '../interfaces/User/IDocumentUser';
import { connectToMongo, disconnectFromMongo } from './MongoService';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from '../interfaces/User/IUser';
import {
  FailedCreateUserError,
  UserNotFoundError,
  UserUnexpectedError,
} from '../interfaces/User/Errors';

const SECRET_KEY = process.env.SECRET_KEY || 'woovi-challenge-secret';

const logger = createCustomLogger('auth-service');

export class UserService {
  static async connectMongo(): Promise<Result<boolean>> {
    logger.info('Initializing AuthService...');
    const connectResult = await connectToMongo();
    if (!connectResult.success) {
      logger.error('Failed to connect to MongoDB');
      return new Result<boolean>({
        success: false,
        data: null,
        error: new Error('Failed to connect to MongoDB'),
      });
    }
    logger.info('AuthService initialized successfully');
    return new Result<boolean>({ data: true, success: true });
  }

  static async disconnectFromMongo(): Promise<Result<boolean>> {
    logger.info('Initializing AuthService...');
    const disconnectResult = await disconnectFromMongo();
    if (!disconnectResult.success) {
      logger.error('Failed to disconnect from MongoDB');
      return new Result<boolean>({
        success: false,
        data: null,
        error: new Error('Failed to disconnect to MongoDB'),
      });
    }
    logger.info('AuthService disconnected successfully');
    return new Result<boolean>({ data: true, success: true });
  }

  static generateToken(username: string): string {
    logger.info(`Generating token for user: ${username}`);
    const token = jwt.sign({ user: username, nonce: uuidv4() }, SECRET_KEY, {
      expiresIn: '1h',
    });
    logger.info(`Token generated successfully for user: ${username}`);
    return token;
  }

  static async updateUser(user: IDocumentUser): Promise<Result<IDocumentUser>> {
    try {
      const updatedUser = await UserModel.findOneAndUpdate(
        { userName: user.userName },
        user,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return new Result<IDocumentUser>({
          success: false,
          data: null,
          error: new UserUnexpectedError(
            `Unexpected error during find and update for user: ${user.userName}`
          ),
        });
      }

      logger.info(`Successfully updated user: ${user.userName}`);
      return new Result<IDocumentUser>({
        success: true,
        data: updatedUser.toObject(),
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        return new Result<IDocumentUser>({
          success: false,
          data: null,
          error: new Error('Unexpected Update Error'),
        });
      }
      logger.error(
        `Error updating user: ${user.userName}. Error: ${error.message}`
      );
      return new Result<IDocumentUser>({
        success: false,
        data: null,
        error: error,
      });
    }
  }

  static async getUser(userName: string): Promise<Result<IDocumentUser>> {
    try {
      const userDB = await UserModel.findOne({ userName: userName });

      if (!userDB) {
        logger.warn(`Cannot found user in DB: ${userName}`);

        return new Result<IDocumentUser>({
          success: false,
          data: null,
          error: new UserNotFoundError(`User not found: ${userName}`),
        });
      }

      logger.warn(`User successfully retrieved: ${userName}`);
      return new Result<IDocumentUser>({
        success: true,
        data: userDB,
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        logger.warn(
          `An unexpected error occurred in mongo when retrieving bucket for user: ${userName}`
        );

        return new Result<IDocumentUser>({
          success: false,
          data: null,
          error: new UserUnexpectedError(),
        });
      }
      logger.info(
        `An error occured in mongo when retrieving bucket for user: ${userName}`
      );
      return new Result<IDocumentUser>({
        success: false,
        data: null,
        error: new UserNotFoundError(error.message),
      });
    }
  }

  static async createUser(user: IUser): Promise<Result<IDocumentUser>> {
    logger.info(`Attempting to create user: ${user.userName}`);

    const existingUser = (await UserModel.findOne({
      username: user.userName,
    })) as IDocumentUser;

    if (!existingUser) {
      logger.info(
        `No existing user found. Creating new user: ${user.userName}`
      );
      try {
        const newUser = new UserModel(user);
        await newUser.save();
        logger.info(
          `User with username: ${user.userName} created successfully`
        );
        return new Result<IDocumentUser>({ success: true, data: newUser });
      } catch (error) {
        if (!(error instanceof Error)) {
          logger.error('Unknown error while creating user');
          return new Result<IDocumentUser>({
            success: false,
            data: null,
            error: new UserUnexpectedError(
              'An unknown error occurred during user creation'
            ),
          });
        }
        logger.error(
          `Error creating user with username: ${user.userName}, error: ${error.message}`
        );
        return new Result<IDocumentUser>({
          success: false,
          data: null,
          error: new FailedCreateUserError(),
        });
      }
    }

    logger.info(`Existing user found with username: ${user.userName}`);
    return new Result<IDocumentUser>({
      success: true,
      data: existingUser,
    });
  }
}
