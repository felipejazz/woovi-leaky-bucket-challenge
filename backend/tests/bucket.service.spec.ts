import { BucketService } from '../src/services/BucketService';
import { Bucket } from '../src/models/Bucket';
import { AuthService } from '../src/services/AuthService';
import { NoValidTokens, TokenNotFound } from '../src/interfaces/Bucket/Errors';
import { AuthUser } from '../src/models/AuthUser';

jest.mock('../src/services/AuthService');

describe('BucketService', () => {
    let user: AuthUser;
    let bucket: Bucket;

    beforeEach(() => {
        (AuthService.getUserById as jest.Mock).mockReturnValue({
            id: 'user-id',
            username: 'testuser',
            password: 'testpassword',
            token: 'user-token',
        });

        (AuthService.generateToken as jest.Mock).mockReturnValue('generated-token');

        user = new AuthUser({
            id: 'user-id',
            username: 'testuser',
            password: 'testpassword',
            token: 'user-token',
        });

        bucket = new Bucket(user);

    });

    it('should add a token to the bucket', () => {
        const token: string = AuthService.generateToken(user);

        BucketService.addToken(token, bucket);
        expect(bucket.getTokenCount()).toBe(1);
    });

    it('should throw NoValidTokens error when trying to check for a token from an empty bucket', () => {

        expect(() => {
            BucketService.checkBucket({ bucket});
        }).toThrow(NoValidTokens);
    });

    it('should throw TokenNotFound error when the token is not in the bucket', () => {
        const token: string = AuthService.generateToken(user);
        BucketService.addToken(token, bucket);

        const nonExistentToken: string = 'non-existent-token';

        expect(() => {
            BucketService.consumeToken({ bucket, token: nonExistentToken });
        }).toThrow(TokenNotFound);
    });

    it('should consume a token from the bucket', () => {
        const token: string = AuthService.generateToken(user);
        BucketService.addToken(token, bucket);
        expect(bucket.getTokenCount()).toBe(1);
        BucketService.consumeToken({ bucket, token });
        expect(bucket.getTokenCount()).toBe(0);
    });

    it('should not allow more than 10 tokens', () => {
        for (let i = 0; i < 10; i++) {
            const token: string = AuthService.generateToken(user);
            BucketService.addToken(token, bucket);
        }

        const extraToken: string = AuthService.generateToken(user);
        BucketService.addToken(extraToken, bucket);

        expect(bucket.getTokenCount()).toBe(10);
    });

    it('should start token addition with intervals', () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'setInterval');
        jest.spyOn(global, 'clearInterval');

        BucketService.startTokenAddition(bucket);

        expect(setInterval).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 3600000);

        jest.advanceTimersByTime(3600000);
        expect(bucket.getTokenCount()).toBe(1);
        jest.advanceTimersByTime(3600000);
        expect(bucket.getTokenCount()).toBe(2);
        BucketService.stopTokenAddition(bucket);
    });

    it('should stop token addition', () => {
        jest.useFakeTimers();
        jest.spyOn(global, 'setInterval');
        jest.spyOn(global, 'clearInterval');

        BucketService.startTokenAddition(bucket);
        jest.advanceTimersByTime(3600000);
        expect(bucket.getTokenCount()).toBe(1);
        BucketService.stopTokenAddition(bucket);
        jest.advanceTimersByTime(2 * 3600000);
        expect(bucket.getTokenCount()).toBe(1);
    });
});
