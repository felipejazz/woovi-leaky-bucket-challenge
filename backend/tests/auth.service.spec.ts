import { AuthService } from '../src/services/AuthService';
import { IDecodedJWT } from '../src/interfaces/IDecodedJWT';
import { AuthUser } from '../src/models/AuthUser';
import { connectToMongo, disconnectFromMongo } from '../src/services/MongoService';
import { UserModel } from '../src/models/mongoose/UserModel';
import { AuthFailedCreateUserError, AuthUserInvalidTokenError, AuthUserTokenRevokedError, AuthUserNotFoundError, AuthTokenVerificationError } from '../src/interfaces/Auth/Errors';
import { IAuthUser } from '../src/interfaces/User/IAuthUser';
import { IDocumentAuthUser } from '../src/interfaces/User/IDocumentAuthUser';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import  mongoose  from 'mongoose';

describe('AuthService', () => {
    const username =  'testuser'; 
    const password =  'testpassword'; 
    let mongoServer: MongoMemoryReplSet;

    beforeAll(async () => {
        mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    beforeEach(async () => {
        await UserModel.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it('should verify a valid token', async () => {
        const token = AuthService.generateToken(username);
        const authUser = new AuthUser({
            userName: username,
            password: password,
            token: token,
        });
        const userCreatedResult = await AuthService.createUser(authUser);
        if(!userCreatedResult){
            throw new Error("Unexpected error creating user")
        }
        const userCreated = userCreatedResult.data
        if(!userCreated) {
            throw userCreatedResult.error
        }        
        const verifyResult = await AuthService.verifyToken({user: userCreated, token: token});
        if(!verifyResult) {
            throw new Error("Unexpected Error while verifying")
        }
        expect(verifyResult.success).toBe(true);
        const decoded = verifyResult.data as IDecodedJWT;
        expect(decoded).toHaveProperty('user', username);
    });

    it('should throw an error for an invalid token', async () => {
        const invalidToken: string = 'invalid-token';
        const token = AuthService.generateToken(username);

        const authUser = new AuthUser({
            userName: username,
            password: password,
            token: token,
        });
    
        const userCreatedResult = await AuthService.createUser(authUser);
        if(!userCreatedResult){
            throw new Error("Unexpected error creating user")
        }
        const userCreated = userCreatedResult.data
        if(!userCreated) {
            throw userCreatedResult.error
        }

        const result = await AuthService.verifyToken({user: userCreated, token: invalidToken});
        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(AuthTokenVerificationError);
    });

    it('should revoke a token', async () => {
        const token = AuthService.generateToken(username);   

        const authUser = new AuthUser({
            userName: username,
            password: password,
            token: token,
        });
        const userCreatedResult = await AuthService.createUser(authUser);
        if(!userCreatedResult){
            throw new Error("Unexpected error creating user")
        }
        expect(userCreatedResult.success).toBe(true)
        const userCreated = userCreatedResult.data
        if(!userCreated) {
            throw userCreatedResult.error
        }
        const revokeResult = await AuthService.revokeToken({user: userCreated, token: token});
        if (!revokeResult) {
            throw new Error("Unexpected error while revoking token")
        }
        if(!revokeResult.success) {
            throw revokeResult.error
        }
        const userRevokedResult = await AuthService.getUser(authUser.userName)
        if(!userRevokedResult) {
            throw new Error("Unexpected error while get user")
        }

        expect(revokeResult.success).toBe(true);

        const verifyResult = await AuthService.verifyToken({user: userCreated, token:token});
        expect(verifyResult.success).toBe(false);
        expect(verifyResult.error).toBeInstanceOf(AuthUserTokenRevokedError);
    });

    it('should create a new user', async () => {
        const token = AuthService.generateToken(username)
        const user: IAuthUser = { userName:username, password, token };
        const createResult = await AuthService.createUser(user);
        expect(createResult.success).toBe(true);
    });

    it('should not create a user with the same username', async () => {
        const token = AuthService.generateToken(username);   

        const authUser = new AuthUser({
            userName: username,
            password: password,
            token: token,
        });
        const user: IAuthUser = { userName: username, password, token };
        const userCreatedResult = await AuthService.createUser(authUser);
        if(!userCreatedResult){
            throw new Error("Unexpected error creating user")
        }
        const userCreated = userCreatedResult.data
        if(!userCreated) {
            throw userCreatedResult.error
        }
        await AuthService.createUser(user);
        const duplicateUserResult = await AuthService.createUser(user);

        expect(duplicateUserResult.success).toBe(false);
    });

    it('should retrieve an user by name', async () => {
        const token = AuthService.generateToken(username)
        const user: IAuthUser = { userName: username, password, token };
        const createResult = await AuthService.createUser(user);

        expect(createResult.success).toBe(true);

        const getUserResult = await AuthService.getUser(username);
        expect(getUserResult.success).toBe(true);
        expect(getUserResult.data).toHaveProperty('userName', username);
    });

    it('should update an existing user', async () => {
        const token = AuthService.generateToken(username)
        const user: IAuthUser = { userName: username, password, token };
        const userCreatedResult = await AuthService.createUser(user);
        if (!userCreatedResult.success) {
            throw userCreatedResult.error
        }
        const userCreated = userCreatedResult.data as IDocumentAuthUser
        userCreated.password = 'newpassword'
        const updateResult = await AuthService.updateUser(userCreated);
        if(!updateResult.success) {
            throw updateResult.error
        }
        expect(updateResult.success).toBe(true);
        expect(updateResult.data).toHaveProperty('password', 'newpassword');
    });
    
});
