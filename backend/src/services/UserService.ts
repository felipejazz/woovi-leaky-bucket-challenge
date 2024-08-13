import { User } from "../models/User";
import createCustomLogger from "../utils/logger";

const logger = createCustomLogger('user-service');

export class UserService {
    static updateToken({ token, user }: { token: string, user: User }): void {
        logger.info(`Updating token for user: ${user.id}`);

        try {
            user.token = token;
            logger.info(`Token updated successfully for user: ${user.id}`);
        } catch (error) {
            if (!(error instanceof Error)) {
                logger.error(`Unknown error updating token for user: ${user.id}`);
                throw new Error('Failed to update token');
            }
            logger.error(`Error updating token for user: ${user.id}, error: ${error.message}`);
            throw error
        }
    }
}
