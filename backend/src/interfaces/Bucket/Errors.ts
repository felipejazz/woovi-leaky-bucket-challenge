export class NoValidTokens extends Error {
    constructor() {
        super('Bucket has no more valid tokens');
        this.name = 'NoValidTokens';
        this.message= 'There is no valid token in this bucket.'
    }
}

export class TokenNotFound extends Error {
    constructor() {
        super('Token not found in the bucket');
        this.name = 'TokenNotFound';
        this.message= 'Token not found in this bucket.'
    }
}