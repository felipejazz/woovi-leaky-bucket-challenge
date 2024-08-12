import { AuthService } from '../src/services/AuthService';
import { IUser } from '../src/interfaces/User/IUser';
import { IDecodedJWT } from '../src/interfaces/IDecodedJWT';

describe('AuthService', () => {
    const user: IUser = {
        id: 'user-id',
        username: 'testuser',
        password: 'testpassword',
    };

    it('should generate a token', () => {
        const token: string = AuthService.generateToken(user);
        expect(typeof token).toBe('string');
    });

    it('should verify a valid token', () => {
        const token: string = AuthService.generateToken(user);
        const decoded: IDecodedJWT = AuthService.verifyToken(token);

        expect(decoded).toHaveProperty('id', user.id);
        expect(decoded).toHaveProperty('username', user.username);
    });

    it('should throw an error for an invalid token', () => {
        const invalidToken: string =  'invalid-token';

        expect(() => {
            AuthService.verifyToken(invalidToken);
        }).toThrow('Invalid token');
    });

    it('should revoke a token', () => {
        const token: string = AuthService.generateToken(user);

        AuthService.revokeToken(token);
        
        expect(() => {
            AuthService.verifyToken(token);
        }).toThrow('Token has been revoked');
    });
});
