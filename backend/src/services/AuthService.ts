import jwt from 'jsonwebtoken';
import { IUser } from '../interfaces/User/IUser';
import { IDecodedJWT } from '../interfaces/IDecodedJWT';
import createCustomLogger from '../utils/logger';
import { UserModel } from '../models/mongoose/UserModel';
import { IAuthUser } from '../interfaces/User/IAuthUser';
import { Result } from '../models/Result';
import { IDocumentAuthUser } from '../interfaces/User/IDocumentAuthUser';
import { AuthFailedCreateUserError, AuthFailedUpdateUserError, AuthUserFailRevokeTokenError, AuthUserInvalidTokenError, AuthUserTokenRevokedError, AuthUserNotFoundError, AuthUserUnexpectedError, AuthTokenVerificationError } from '../interfaces/Auth/Errors';
import { connectToMongo, disconnectFromMongo } from './MongoService';
import { User } from '../models/User';
import { IDocumentBucket } from '../interfaces/Bucket/IDocumentBucket';
import { v4 as uuidv4 } from 'uuid';

const SECRET_KEY = process.env.SECRET_KEY || 'woovi-challenge-secret';

const logger = createCustomLogger('auth-service');


export class AuthService {

    static async connectMongo(): Promise<Result<boolean>> {
        logger.info('Initializing AuthService...');
        const connectResult = await connectToMongo();
        if (!connectResult.success) {
            logger.error('Failed to connect to MongoDB');
            return new Result<boolean>({success: false, data: null, error: new Error('Failed to connect to MongoDB')});
        }
        logger.info('AuthService initialized successfully');
        return new Result<boolean>({data: true, success:true})

    }

    static async disconnectFromMongo(): Promise<Result<boolean>> {
        logger.info('Initializing AuthService...');
        const disconnectResult = await disconnectFromMongo();
        if (!disconnectResult.success) {
            logger.error('Failed to disconnect from MongoDB');
            return new Result<boolean>({success: false, data: null, error: new Error('Failed to disconnect to MongoDB')});;
        }
        logger.info('AuthService disconnected successfully');
        return new Result<boolean>({data: true, success:true})


    }

    static generateToken(username: string): string {
        logger.info(`Generating token for user: ${username}`);
            const token = jwt.sign({ user: username , nonce: uuidv4()}, SECRET_KEY, { expiresIn: '1h' });
            logger.info(`Token generated successfully for user: ${username}`);
            return token
    }

    static async verifyToken({token, user}:{token: string, user: IDocumentAuthUser}): Promise<Result<IDecodedJWT>> {
        logger.warn(`Start token verification for user: ${user.userName}`);
        
        const userResult = await this.getUser(user.userName)
        if(!userResult.success) {
            return new Result<IDecodedJWT>({success: false, data: null, error: userResult.error});
        }
        const userDb = userResult.data;
        if (!userDb) {
            return new Result<IDecodedJWT>({success: false, data: null, error: new AuthUserUnexpectedError('Error unpacking userResult object')});
        }

        if (userDb.revokedTokens && userDb.revokedTokens.includes(token)) {
            logger.warn(`Token has been revoked for user: ${userDb.userName}`);
            return new Result<IDecodedJWT>({success: false, data: null, error: new AuthUserTokenRevokedError()});
        }
        try {
            const decoded = jwt.verify(token, SECRET_KEY) as IDecodedJWT;
            return new Result<IDecodedJWT>({success: true, data: decoded});
        } catch (error) {
            if (!(error instanceof jwt.JsonWebTokenError)) {
                return new Result<IDecodedJWT>({success: false, data: null, error: new AuthUserUnexpectedError()})
            }
            return new Result<IDecodedJWT>({success: false, data: null, error: new AuthTokenVerificationError(error.message)});
    }
    }

    static async revokeToken({user, token} : {user: IDocumentAuthUser, token: string}): Promise<Result<IDocumentAuthUser>> {
        logger.warn(`Start token revokation for user: ${user.userName}`);

        const userResult = await this.getUser(user.userName);
        if (!userResult) {
            logger.warn(`Error during get user operation for: ${user.userName}`);
            return new Result<IDocumentAuthUser>({ success: false, data: null, error: new AuthUserUnexpectedError() });
        }
        if (!userResult.success) {
            logger.warn(`User with username: ${user.userName} not found`);
            return new Result<IDocumentAuthUser>({ success: false, data: null, error: userResult.error });
        }
        const userDb = userResult.data as IDocumentAuthUser
        if (!userDb) {
            logger.warn(`Error unpacking userdb object for: ${user.userName}`);
            return new Result<IDocumentAuthUser>({ success: false, data: null, error: new AuthUserUnexpectedError('Error unpacking user db result objetc') });
        }
        if (userDb.revokedTokens && userDb.revokedTokens.includes(token)) {
            logger.warn(`Token is already revoked for user: ${user.userName}`);
            return new Result<IDocumentAuthUser>({ success: false, data: null, error: new AuthUserFailRevokeTokenError() });
        }
        const actualRevokedTokens = userDb.revokedTokens; 
        actualRevokedTokens?.push(token)
        const updateResult = await this.updateUser(userDb);
        if (!updateResult.success || !updateResult.data) {
            logger.warn(`Fail to updateUser after revoke: ${user.userName}`);
            return new Result<IDocumentAuthUser>({ success: false, data: null, error: updateResult.error });
        }
        
        logger.info(`Token revoked successfully for user: ${user.userName}`);
        return { success: true, data: updateResult.data };
    }


    static async updateUser(user: IDocumentAuthUser): Promise<Result<IDocumentAuthUser>> {
        try {
            const updatedUser = await UserModel.findOneAndUpdate(
                { userName: user.userName },
                user,
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return new Result<IDocumentAuthUser>({
                    success: false,
                    data: null,
                    error: new AuthUserUnexpectedError(`Unexpected error during find and update for user: ${user.userName}`),
                });
            }

            logger.info(`Successfully updated user: ${user.userName}`);
            return new Result<IDocumentAuthUser>({
                success: true,
                data: updatedUser.toObject(),
            });
        } catch (error) {
            if (!(error instanceof Error)) {
                return new Result<IDocumentAuthUser>({
                    success: false,
                    data: null,
                    error: new Error("Unexpected Update Error"),
                });
            }
            logger.error(`Error updating user: ${user.userName}. Error: ${error.message}`);
            return new Result<IDocumentAuthUser>({
                success: false,
                data: null,
                error: error,
            });
        }
    }
        

    static async getUser(userName: string): Promise<Result<IDocumentAuthUser>>{
        try {
            const userBucket = await UserModel.findOne(
                { userName: userName },
            ).lean<IDocumentAuthUser>(); 
        
            if (!userBucket) {
                logger.warn(`Cannot found user in DB: ${userName}`);

                return new Result<IDocumentAuthUser>({
                    success: false,
                    data: null,
                    error: new AuthUserNotFoundError(`User not found: ${userName}`),
                });
            }

            logger.warn(`User successfully retrieved: ${userName}`)
            return new Result<IDocumentAuthUser>({
                success: true,
                data: userBucket,
            });
    
        } catch (error) {
            if (!(error instanceof Error)) {
                logger.warn(`An error occurred when retrieving bucket for user: ${userName}`);

                return new Result<IDocumentAuthUser>({
                    success: false,
                    data: null,
                    error: new AuthUserUnexpectedError()
                });
            }
            logger.info(`Bucket successfully retrieved for user: ${userName}`);
            return new Result<IDocumentAuthUser>({
                success: false,
                data: null,
                error: new AuthUserNotFoundError(error.message),
            });
        }
    }

    static async createUser(user: IAuthUser): Promise<Result<IDocumentAuthUser>> {
        logger.info(`Attempting to create user: ${user.userName}`);
    
        let existingUser = await UserModel.findOne({ username: user.userName }) as IDocumentAuthUser;
    
        if (!existingUser) {
            logger.info(`No existing user found. Creating new user: ${user.userName}`);
            try {
                const newUser = new UserModel(user);
                await newUser.save();
                logger.info(`User with username: ${user.userName} created successfully`);
                return new Result<IDocumentAuthUser>({ success: true, data: newUser });
            } catch (error) {
                if (!(error instanceof Error)) {
                    logger.error('Unknown error while creating user');
                    return new Result<IDocumentAuthUser>({
                        success: false,
                        data: null,
                        error: new AuthUserUnexpectedError('An unknown error occurred during user creation')
                    });
                }
                logger.error(`Error creating user with username: ${user.userName}, error: ${error.message}`);
                return new Result<IDocumentAuthUser>({
                    success: false,
                    data: null,
                    error: new AuthFailedCreateUserError()
                });
            }
        }

        logger.info(`Existing user found with username: ${user.userName}`);
        return new Result<IDocumentAuthUser>({
            success: true,
            data: existingUser
        });
    }
}
