import { BucketNotFoundError, BucketNoValidTokensError } from "../Bucket/Errors";

export class InvalidPixKeyError extends Error {
    constructor(key?: string) {
        super(`Invalid Pix key format: ${key}. It must be a valid email or phone number.`);
        this.name = 'InvalidPixKeyError';
        this.message= 'Invalid PIX KEY FORMAT. Allowed format: email@example.om or telephone +5511999999999'
    }
}

export class InvalidPixValueError extends Error {
    constructor(value?: number) {
        super(`Invalid value: ${value}. It must be a positive number.`);
        this.name = 'InvalidPixValueError';
        this.message= 'Invalid PIX VALUE. only positives values are allowed.';
    }
}

export type PixError = 
    | BucketNoValidTokensError
    | BucketNotFoundError
    | InvalidPixKeyError
    | InvalidPixValueError
    | Error;
