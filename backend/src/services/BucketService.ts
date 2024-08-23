import { UserService } from "./UserService";
import { BucketCountError, BucketFullError, BucketNotFoundError, BucketNoValidTokensError, BucketUnexpectedError, NoTokenToConsumeError, CreateBucketError, BucketRevokeTokenError, BucketTokenVerificationError } from "../interfaces/Bucket/Errors";
import createCustomLogger from "../utils/logger";
import { BucketModel } from "../models/mongoose/BucketModel";
import { Result } from "../models/Result";
import { IDocumentBucket } from "../interfaces/Bucket/IDocumentBucket";
import { IDocumentUser } from "../interfaces/User/IDocumentUser";
import jwt from "jsonwebtoken";
import { IDecodedJWT } from "../interfaces/IDecodedJWT";


const MAX_TOKENS = 10;
const TOKENS_INTERVAL = 3600000;
const logger = createCustomLogger('bucket-service');
export class BucketService {

    static async createBucket(user: IDocumentUser): Promise<Result<IDocumentBucket> > {

        logger.info(`Checking if bucket exists for user: ${user.userName}`);

        const bucketResult = await this.getBucket(user.userName)

        if(!bucketResult){
            return new Result<IDocumentBucket>({ success: false, data: null, error: new BucketUnexpectedError('Errow while ty to get user from bucket') });
        }

        if (!bucketResult.success && (bucketResult.error instanceof BucketNotFoundError)) {
            logger.info(`Creating new bucket for user: ${user.userName}`);
            const userAuthDbResult = await UserService.getUser(user.userName) 
            const userAuthDb = userAuthDbResult.data as IDocumentUser
            let bucketToCreate = new BucketModel({ userName: userAuthDb.userName, tokens: [] }) as IDocumentBucket;
            
            try {
                await bucketToCreate.save();
                logger.info(`New bucket created for user: ${userAuthDb.userName}`);
                return new Result<IDocumentBucket>({success: true, data: bucketToCreate});
            } catch (error) {
                if (!(error instanceof Error)) {
                    logger.error('Unknown error while creating user');
                    return new Result<IDocumentBucket>({
                        success: false,
                        data: null,
                        error: new BucketUnexpectedError('An unknown error occurred during user creation')
                    });
                }
                logger.error(`Error creating user with username: ${user.userName}, error: ${error.message}`);
                return new Result<IDocumentBucket>({
                    success: false,
                    data: null,
                    error: new CreateBucketError()
                });
            }
        }

        const userBucket = bucketResult.data
        if(!userBucket) {
            return new Result<IDocumentBucket>({success: false, data: null, error: new BucketUnexpectedError('Error unpacking userBucket after succefully retrieve from db')});
        }
        logger.info(`Existing bucket found for user: ${user.userName}`);
        return new Result({success: true, data: userBucket});
    }

    static async getBucket(userName: string): Promise<Result<IDocumentBucket>> {
        try {
            const userBucket = await BucketModel.findOne({ userName })

            if (!userBucket) {
                logger.warn(`Cannot find bucket for user: ${userName}`);
                return new Result<IDocumentBucket>({
                    success: false,
                    data: null,
                    error: new BucketNotFoundError(`Bucket not found for user: ${userName}`),
                });
            }

            const now = new Date();
            const timeDiff = now.getTime() - userBucket.lastTimeStamp.getTime();
            const tokensToAdd = Math.floor(timeDiff / TOKENS_INTERVAL);
            logger.warn(`Tokens to add ${tokensToAdd}`)
            if (tokensToAdd > 0) {
                const newTokenCount = Math.min(userBucket.tokens.length + tokensToAdd, MAX_TOKENS);
                const tokensToActuallyAdd = newTokenCount - userBucket.tokens.length;

                for (let i = 0; i < tokensToActuallyAdd; i++) {
                    userBucket.tokens.push(UserService.generateToken(userBucket.userName));
                }

                userBucket.lastTimeStamp = now;
                const updateResult = await this.updateBucket(userBucket);

                if (!updateResult.success) {
                    return new Result<IDocumentBucket>({ success: false, data: null, error: updateResult.error });
                }

                logger.info(`Tokens added to bucket for user: ${userName}. New token count: ${userBucket.tokens.length}`);
                return new Result<IDocumentBucket>({ success: true, data: updateResult.data });
            }

            logger.info(`Bucket successfully retrieved for user: ${userName}`);
            return new Result<IDocumentBucket>({ success: true, data: userBucket });

        } catch (error) {
            logger.warn(`An error occurred when retrieving bucket for user: ${userName}`);
            return new Result<IDocumentBucket>({
                success: false,
                data: null,
                error: new BucketUnexpectedError('Get Bucket unexpected error'),
            });
        }
    }

    static async fillBucket({bucket, initialToken}: {bucket: IDocumentBucket, initialToken?:string}): Promise<Result<IDocumentBucket>> {
        logger.info(`Filling bucket for user: ${bucket.userName}`);
        
        bucket.tokens = []
        const tokensToAdd = MAX_TOKENS - bucket.tokens.length - (initialToken ? 1 : 0);
        
        if (tokensToAdd <= 0) {
            logger.info(`Bucket already full`);
            return new Result<IDocumentBucket>({ success: true, data: bucket });
        }
        
        logger.info(`Adding ${tokensToAdd} tokens to bucket`);
        if (initialToken) {
            bucket.tokens.push(initialToken)
        }
        for (let i = 0; i < tokensToAdd; i++) {
            const newToken = UserService.generateToken(bucket.userName);
            bucket.tokens.push(newToken);
        }
        const updateResult = await this.updateBucket(bucket);

        if (!updateResult.success) {
            logger.error(`Failed to update bucket for user: ${bucket.userName}`);
            return new Result<IDocumentBucket>({ success: false, data: null, error: updateResult.error });
        }

        const updatedBucket = updateResult.data;
        if (!updatedBucket) {
            return new Result<IDocumentBucket>({ success: false, data: null, error: new BucketUnexpectedError('Error unpacking updated bucket data') });
        }

        logger.info(`Bucket filled successfully for user: ${bucket.userName}`);
        return new Result<IDocumentBucket>({ success: true, data: updatedBucket });
    }

    
    static async updateBucket(bucket: IDocumentBucket): Promise<Result<IDocumentBucket>> {
        try {
            
            const updatedBucket = await BucketModel.findOneAndUpdate(
                { userName: bucket.userName }, 
                bucket, 
                { new: true, runValidators: true } 
            );
    
            if (!updatedBucket) {
                return new Result<IDocumentBucket>({
                    success: false,
                    data: null,
                    error: new BucketUnexpectedError(`Unexpected error during find and updatefor user: ${bucket.userName}`),
                });
            }
    
            logger.info(`Successfully updated bucket for user: ${bucket.userName}`);
            return new Result<IDocumentBucket>({
                success: true,
                data: updatedBucket.toObject(), 
            });
        } catch (error) {
            if(!(error instanceof Error)) {
                return new Result<IDocumentBucket>({
                    success: false,
                    data: null,
                    error: new Error("Unexpected Update Error"),
                });
            }
            logger.error(`Error updating bucket for user: ${bucket.userName}. Error: ${error.message}`);
            return new Result<IDocumentBucket>({
                success: false,
                data: null,
                error: error,
            });
        }
    }
    

    static async addToken({token, bucket}:{token: string, bucket: IDocumentBucket}): Promise<Result<IDocumentBucket>> {
        logger.info(`Try to add token to user: ${bucket.userName}`);
        if (bucket.tokens.length >= MAX_TOKENS) {
            const error = new BucketFullError()
            return new Result<IDocumentBucket>({success:false, data: null, error: error})
        }
        bucket.tokens.push(token);
        const updateBucketResult = await this.updateBucket(bucket);
        if (!updateBucketResult.success) {
            return new Result<IDocumentBucket>({success:false, data: null, error: updateBucketResult.error})

        }
        const updatedBucket = updateBucketResult.data
        if(!updatedBucket) {
            return new Result<IDocumentBucket>({success:false, data:null, error:new BucketUnexpectedError('Error unpacking updatedBucket data')})

        }
        logger.info(`Added new token for user: ${updatedBucket.userName}, tokens count: ${updatedBucket.tokens.length}`);
        return new Result({success: true, data: updatedBucket});
    }

    static async revokeToken({bucket, token}:{bucket: IDocumentBucket, token: string}): Promise<Result<IDocumentBucket>> {
    
        logger.info(`Revoking token for ${bucket.userName}`)

        if (bucket.revokedTokens.includes(token)) {
            logger.warn(`Token is already revoked for user: ${bucket.userName}`);
            return new Result<IDocumentBucket>({ success: false, data: bucket, error: new BucketRevokeTokenError("Token is already revoked") });
        }
        if (!bucket.tokens.includes(token)){
            logger.warn(`Token does not belongs to user: ${bucket.userName}`);
            return new Result<IDocumentBucket>({ success: false, data: bucket, error: new BucketRevokeTokenError("Token does not belong to user") });
        }
        
        bucket.tokens = bucket.tokens.filter(t => t !== token);
        bucket.revokedTokens.push(token)
        const bucketUpdateResult = await this.updateBucket(bucket)
        if(!bucketUpdateResult){
            logger.error(`Error in update bucket result object`);
            return new Result<IDocumentBucket>({ success: false, data: bucket, error: new BucketRevokeTokenError("Error updating user") });
        }

        if(!bucketUpdateResult.success){
            logger.error(`Error updating bucket after revoke token`)
            
            return new Result<IDocumentBucket>({ success: false, data: bucket, error: bucketUpdateResult.error });
        }
        const updatedBucket = bucketUpdateResult.data
        logger.warn(`Token is already revoked for user: ${bucket.userName}`);
            return new Result<IDocumentBucket>({ success: true, data: updatedBucket});

    }
    static async verifyToken({token}: {bucket: IDocumentBucket, token: string}) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY || 'woovi-challenge-secret') as IDecodedJWT;
            return new Result<IDecodedJWT>({success: true, data: decoded});
        } catch (error) {
            if (!(error instanceof jwt.JsonWebTokenError)) {
                return new Result<IDecodedJWT>({success: false, data: null, error: new BucketUnexpectedError()})
            }
            return new Result<IDecodedJWT>({success: false, data: null, error: new BucketTokenVerificationError(error.message)});
        }
    }
    
    static async checkIfBucketIsEmpty(bucket: IDocumentBucket): Promise<Result<boolean>> {
        logger.info(`Ver if bucket token is in user bucket: ${bucket.userName}`);
        if (bucket.tokens.length === 0) {
            logger.warn(`Bucket is empty. No valid tokens available for user: ${bucket.userName}`);
            return new Result({success: false, data: false, error: new BucketNoValidTokensError()});
        }
        logger.info(`User bucket contains valid tokens`);
        return new Result({success: true, data: true});
    }

    static async getTokenCount(user: IDocumentUser): Promise<Result<number>> {
        const userBucketResult = await this.getBucket(user.userName)
        if(!userBucketResult.success) {
            return new Result<number>({success: false, data:null,  error: userBucketResult.error})
        }
        const bucketToCount = userBucketResult.data
        if (!bucketToCount) {
            return new Result<number>({success: false, data:null,  error: new BucketCountError("Bucket object Result is undefined")})
        }
        if (!bucketToCount.tokens){
            return new Result<number>({success: false, data:null,  error: new BucketCountError("Bucket token list object is undefined")})
        }
        logger.info(`Getting token count for user: ${user.userName}, tokens count: ${bucketToCount.tokens.length}`);
        return new Result({success: true, data: bucketToCount.tokens.length});

    }
}
