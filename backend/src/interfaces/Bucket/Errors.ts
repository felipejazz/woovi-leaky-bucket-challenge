export class BucketNoValidTokensError extends Error {
    constructor(message: string = 'Bucket has no more valid tokens') {
        super(message);
        this.name = 'BucketNoValidTokensError';
    }
}

export class BucketTokenNotFoundError extends Error {
    constructor(message: string = 'Token not found in the bucket') {
        super(message);
        this.name = 'BucketTokenNotFoundError';
    }
}

export class CreateBucketError extends Error {
    constructor(message: string = 'Failed to create bucket in MongoDb') {
        super(message);
        this.name = 'CreateBucketError';
    }
}

export class BucketNotFoundError extends Error {
    constructor(message: string = 'Bucket not found in MongoDb') {
        super(message);
        this.name = 'BucketNotFoundError';
    }
}

export class BucketFullError extends Error {
    constructor(message: string = 'Bucket is already full') {
        super(message);
        this.name = 'BucketFullError';
    }
}

export class BucketServiceAdditionError extends Error {
    constructor(message: string = 'Failed to add service to bucket') {
        super(message);
        this.name = 'BucketServiceAdditionError';
    }
}

export class BucketCountError extends Error {
    constructor(message: string = 'Failed to retrieve token count from bucket') {
        super(message);
        this.name = 'BucketCountError';
    }
}
export class NoTokenToConsumeError extends Error {
    constructor(message: string = 'No valid token token to consume in bucket') {
        super(message);
        this.name = 'NoTokenToConsumeError';
                Object.setPrototypeOf(this, NoTokenToConsumeError.prototype);
    }
}

export class BucketUnexpectedError extends Error {
    constructor(message: string = 'Unexpected error during bucket operation') {
        super(message);
        this.name = 'GetBucketUnexpectedError';
    }
}
