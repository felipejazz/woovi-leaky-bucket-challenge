import { AuthService } from "./AuthService";
import { BucketCountError, BucketFullError, BucketNotFoundError, BucketNoValidTokensError, BucketUnexpectedError, NoTokenToConsumeError, CreateBucketError } from "../interfaces/Bucket/Errors";
import createCustomLogger from "../utils/logger";
import { BucketModel } from "../models/mongoose/BucketModel";
import { Result } from "../models/Result";
import { IDocumentBucket } from "../interfaces/Bucket/IDocumentBucket";
import { IDocumentAuthUser } from "../interfaces/User/IDocumentAuthUser";
import { IAuthUser } from "../interfaces/User/IAuthUser";


const MAX_TOKENS = 10;
const TOKENS_INTERVAL = 3600000;
const logger = createCustomLogger('bucket-service');
export class BucketService {

    static async createBucket(user: IDocumentAuthUser): Promise<Result<IDocumentBucket> > {

        logger.info(`Checking if bucket exists for user: ${user.userName}`);

        const bucketResult = await this.getBucket(user.userName)

        if(!bucketResult){
            return new Result<IDocumentBucket>({ success: false, data: null, error: new BucketUnexpectedError('Errow while ty to get user from bucket') });
        }

        if (!bucketResult.success && (bucketResult.error instanceof BucketNotFoundError)) {
            logger.info(`Creating new bucket for user: ${user.userName}`);
            const userAuthDbResult = await AuthService.getUser(user.userName) 
            const userAuthDb = userAuthDbResult.data as IDocumentAuthUser
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
            const userBucket = await BucketModel.findOne({ userName }).lean<IDocumentBucket>();

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
                    userBucket.tokens.push(AuthService.generateToken(userBucket.userName));
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

    static async fillBucket(user: IDocumentAuthUser): Promise<Result<IDocumentBucket>> {
        logger.info(`Filling bucket for user: ${user.userName}`);

        const bucketResult = await this.getBucket(user.userName);

        if (!bucketResult.success) {
            logger.error(`Failed to retrieve bucket for user: ${user.userName}`);
            return new Result<IDocumentBucket>({ success: false, data: null, error: bucketResult.error });
        }

        const userBucket = bucketResult.data;
        if (!userBucket) {
            return new Result<IDocumentBucket>({ success: false, data: null, error: new BucketUnexpectedError('Error unpacking bucket data') });
        }

        const tokensToAdd = MAX_TOKENS - userBucket.tokens.length;
        if (tokensToAdd <= 0) {
            logger.info(`Bucket already full for user: ${user.userName}`);
            return new Result<IDocumentBucket>({ success: true, data: userBucket });
        }

        logger.info(`Adding ${tokensToAdd} tokens to bucket for user: ${user.userName}`);
        for (let i = 0; i < tokensToAdd; i++) {
            let newToken
            if(i===0){
                newToken = user.token
                userBucket.tokens.push(newToken);
                continue
            }
            newToken = AuthService.generateToken(userBucket.userName);
            userBucket.tokens.push(newToken);
        }

        const updateResult = await this.updateBucket(userBucket);

        if (!updateResult.success) {
            logger.error(`Failed to update bucket for user: ${user.userName}`);
            return new Result<IDocumentBucket>({ success: false, data: null, error: updateResult.error });
        }

        const updatedBucket = updateResult.data;
        if (!updatedBucket) {
            return new Result<IDocumentBucket>({ success: false, data: null, error: new BucketUnexpectedError('Error unpacking updated bucket data') });
        }

        logger.info(`Bucket filled successfully for user: ${user.userName}`);
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

        const bucketResult = await this.getBucket(bucket.userName)
        
        if (!bucketResult.success){
            logger.error(`Cannot get bucket from user: ${bucket.userName}`);

            return new Result<IDocumentBucket>({success:false, data:null, error:bucketResult.error})
        }
        const userBucket = bucketResult.data
        if(!userBucket){
            return new Result<IDocumentBucket>({success:false, data:null, error:new BucketUnexpectedError('Error unpacking first userBucket data')})
        }
        if (userBucket.tokens.length >= MAX_TOKENS) {
            logger.warn(`Cannot add token for user: ${bucket.userName}, bucket already full`);
            return new Result<IDocumentBucket>({success: false, data: null, error: new BucketFullError()});
        }

        userBucket.tokens.push(token);
        const updateBucketResult = await this.updateBucket(userBucket);
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

    static async getTokenToConsume(user: IDocumentAuthUser): Promise<Result<string>> {
        const userBucketResult = await this.getBucket(user.userName);
    
        if(!user) {
            const error = new Error('Error unpacking user');
            return new Result<string>({ success: false, data: null, error: error });
        }
        if (!userBucketResult.success){
            return new Result<string>({ success: false, data: null, error: new BucketNotFoundError() });
        }
        const userBucket = userBucketResult.data;
        if (!userBucket) {
            return new Result<string>({ success: false, data: null, error: new Error("Error unpacking userBucket object") });
        }
    
        let token: string;
    
        if (userBucket.tokens.length > 0) {
            token = userBucket.tokens[0] as string;
            if (!(token === user.token)){
                
                user.token = token;
                const userTokenUpdateResult = await AuthService.updateUser(user);
                if (!userTokenUpdateResult.success) {
                    const error = new Error('Error updating user');
                    return new Result<string>({ success: false, data: null, error: error });
                }
                userBucket.tokens.shift() 
                const userBucketUpdateResult = await this.updateBucket(userBucket)
                if (!userBucketUpdateResult.success) {
                    const error = new Error('Error updating bucket');
                    return new Result<string>({ success: false, data: null, error: error });
                }
                if (userBucket.tokens.length ===0) {
                    user.noValidTokens = true;
                    const userTokenUpdateResult = await AuthService.updateUser(user);
                    if (!userTokenUpdateResult.success){
                        return new Result<string>({ success: false, data: null, error: new BucketUnexpectedError('Error while trying to get user result object') });
                    }

                }
                logger.info(`Token to consume successfully retrieved for user ${user.userName}`);
                return new Result<string>({ success: true, data: token });
            }
            token = userBucket.tokens[1]
            userBucket.tokens.shift()
            user.token = token;
            const userTokenUpdateResult = await AuthService.updateUser(user);
            if (!userTokenUpdateResult.success) {
                const error = new Error('Error updating user');
                return new Result<string>({ success: false, data: null, error: error });
            }
            const userBucketUpdateResult = await this.updateBucket(userBucket)
            if (!userBucketUpdateResult.success) {
                const error = new Error('Error updating bucket');
                return new Result<string>({ success: false, data: null, error: error });
            }
            if (userBucket.tokens.length ===0) {
                user.noValidTokens = true;
                const userTokenUpdateResult = await AuthService.updateUser(user);
                if (!userTokenUpdateResult.success){
                    return new Result<string>({ success: false, data: null, error: new BucketUnexpectedError('Error while trying to get user result object') });
                }

            }
    
            logger.info(`Token to consume successfully retrieved for user ${user.userName}`);
            return new Result<string>({ success: true, data: token });
        }
        token = user.token
        return new Result<string>({ success: false, data: token, error: new NoTokenToConsumeError() });
    }
    

    static async checkBucket(bucket: IDocumentBucket): Promise<Result<boolean>> {
        logger.info(`Checking if user token is in user bucket: ${bucket.userName}`);
        const userBucketResult = await this.getBucket(bucket.userName)
        if(!userBucketResult.success) {
            return new Result({success: false, data: false, error: userBucketResult.error});

        }
        if(!userBucketResult.data){
            throw new BucketUnexpectedError("Fail when unpacking user bucket result object");
            
        }
        const userBucket = userBucketResult.data

        if (userBucket.tokens.length === 0) {
            logger.warn(`Bucket is empty. No valid tokens available for user: ${bucket.userName}`);
            return new Result({success: false, data: false, error: new BucketNoValidTokensError()});
        }
        logger.info(`User bucket contains valid tokens`);
        return new Result({success: true, data: true});
    }

    static async consumeToken(user:IDocumentAuthUser): Promise<Result<boolean>> {
        logger.warn(`Starting to try to consume token for user: ${user.userName}`);
        const userActualToken = user.token
        const revokeTokenResult =  await AuthService.revokeToken({user, token: userActualToken});
        if (!revokeTokenResult) {
            return new Result<boolean>({success: false, data: null, error: new BucketUnexpectedError('Error unpacking revoked token get user result object')})
        }
        if(!revokeTokenResult.success) {
            return new Result<boolean>({success: false, data: null, error: revokeTokenResult.error})
        }
        
        logger.info(`Token consumed for user: ${user.userName}`);
        return new Result<boolean>({data: true, success: true});
    }

    static async getTokenCount(user: IDocumentAuthUser): Promise<Result<number>> {
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
