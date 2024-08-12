import jwt from 'jsonwebtoken';
import { IUser } from '../interfaces/User/IUser';
import { IDecodedJWT } from '../interfaces/IDecodedJWT';
import createCustomLogger from '../utils/logger';
import { IAuthUser } from '../interfaces/User/IAuthUser';

const SECRET_KEY = process.env.SECRET_KEY || 'woovi-challenge-secret';

const revokedTokens: Set<string> = new Set();
const logger = createCustomLogger('auth-service');
const USERS_DB: IAuthUser[] = [];

export class AuthService {
    static generateToken(user: IUser): string {
        logger.info(`Generating token for user: ${user.username}`);
        try {
            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
            logger.info(`Token generated successfully for user: ${user.username}`);
            return token;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Error generating token for user: ${user.username}, error: ${error.message}`);
                throw new Error('Failed to generate token');
            } else {
                logger.error(`Unknown error generating token for user: ${user.username}`);
                throw new Error('An unknown error occurred during token generation');
            }
        }
    }

    static verifyToken(token: string): IDecodedJWT {
        if (revokedTokens.has(token)) {
            throw new Error('Token has been revoked');
        }

        try {
            const decoded = jwt.verify(token, SECRET_KEY) as IDecodedJWT;
            return decoded;
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Invalid token verification attempt, error: ${error.message}`);
                throw new Error('Invalid token');
            } else {
                logger.error('Unknown error during token verification');
                throw new Error('An unknown error occurred during token verification');
            }
        }
    }

    static revokeToken(token: string): void {
        revokedTokens.add(token);
        logger.info('Token revoked successfully');
    }

    static getUserById(userId: string): IAuthUser | undefined {
        logger.info(`Searching for user with ID: ${userId}`);
        const user = USERS_DB.find(u => u.id === userId);
        if (!user) {
            logger.warn(`User with ID: ${userId} not found`);
            throw new Error('USER NOT FOUND IN AUTH DB');
        }
        logger.info(`User with ID: ${userId} found`);
        return user;
    }

    static getUserByName(userName: string): IAuthUser | undefined {
        logger.info(`Searching for user with username: ${userName}`);
        const user = USERS_DB.find(u => u.username === userName);
        if (!user) {
            logger.warn(`User with username: ${userName} not found`);
        }
        return user;
    }

    static createUser(user: IAuthUser) {
        USERS_DB.push(user);
        logger.info(`User with username: ${user.username} created successfully`);
    }

    static updateUser(userId: string, updatedData: Partial<IAuthUser>): IAuthUser | undefined {
        logger.info(`Attempting to update user with ID: ${userId}`);
        const userIndex = USERS_DB.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            logger.warn(`User with ID: ${userId} not found. Update operation aborted.`);
            return undefined;
        }

        const updatedUser = { ...USERS_DB[userIndex], ...updatedData };
        USERS_DB[userIndex] = updatedUser;

        logger.info(`User with ID: ${userId} updated successfully`);
        return updatedUser;
    }
}
