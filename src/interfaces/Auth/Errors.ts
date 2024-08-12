export class NoValidTokens extends Error {
    constructor() {
        super('Bucket has no more valid tokens');
        this.name = 'NoValidTokens';
    }
}

export class TokenNotFound extends Error {
    constructor() {
        super('Token not found in the bucket');
        this.name = 'TokenNotFound';
    }
}