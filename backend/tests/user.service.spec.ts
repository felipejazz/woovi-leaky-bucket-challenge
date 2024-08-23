import { UserService } from '../src/services/UserService';
import { UserModel } from '../src/models/mongoose/UserModel';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import  mongoose  from 'mongoose';
import { IUser } from '../src/interfaces/User/IUser';
import { IDocumentUser } from '../src/interfaces/User/IDocumentUser';

describe('UserService', () => {
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



    it('should create a new user', async () => {
        const token = UserService.generateToken(username)
        const user: IUser = { userName:username, password, token };
        const createResult = await UserService.createUser(user);
        expect(createResult.success).toBe(true);
    });

    it('should not create a user with the same username', async () => {
        const token = UserService.generateToken(username);   

        const authUser ={
            userName: username,
            password: password,
            token: token,
        };
        const user: IUser = { userName: username, password, token };
        const userCreatedResult = await UserService.createUser(authUser);
        if(!userCreatedResult){
            throw new Error("Unexpected error creating user")
        }
        const userCreated = userCreatedResult.data
        if(!userCreated) {
            throw userCreatedResult.error
        }
        await UserService.createUser(user);
        const duplicateUserResult = await UserService.createUser(user);

        expect(duplicateUserResult.success).toBe(false);
    });

    it('should retrieve an user by name', async () => {
        const token = UserService.generateToken(username)
        const user: IUser = { userName: username, password, token };
        const createResult = await UserService.createUser(user);

        expect(createResult.success).toBe(true);

        const getUserResult = await UserService.getUser(username);
        expect(getUserResult.success).toBe(true);
        expect(getUserResult.data).toHaveProperty('userName', username);
    });

    it('should update an existing user', async () => {
        const token = UserService.generateToken(username)
        const user: IUser = { userName: username, password, token };
        const userCreatedResult = await UserService.createUser(user);
        if (!userCreatedResult.success) {
            throw userCreatedResult.error
        }
        const userCreated = userCreatedResult.data as IDocumentUser
        userCreated.password = 'newpassword'
        const updateResult = await UserService.updateUser(userCreated);
        if(!updateResult.success) {
            throw updateResult.error
        }
        expect(updateResult.success).toBe(true);
        expect(updateResult.data).toHaveProperty('password', 'newpassword');
    });
});
