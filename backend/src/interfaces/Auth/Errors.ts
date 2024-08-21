export class AuthFailedUpdateUserError extends Error {
    constructor(message: string = 'Fail creating user in mongoDB') {
        super();
        this.name = 'FailedUpdateUserError';
    }
}
export class AuthFailedCreateUserError extends Error {
    constructor(message: string = 'Fail creating user in mongoDB') {
        super();
        this.name = 'FailedCreateUserError';
    }
}
export class AuthUserInvalidTokenError extends Error {
    constructor(message: string = 'Token verification error') {
        super('Token verification error');
        this.name = 'UserInvalidTokenError';
    }
}
export class AuthUserNotFoundError extends Error {
    constructor(message: string = 'User not found in the MongoDB') {
        super(message);
        this.name = 'UserNotFoundError';
    }
}

export class AuthUserTokenRevokedError extends Error {
    constructor(message: string = 'Token not found in the bucket') {
        super(message);
        this.name = 'UserTokenRevokedError';
    }
}
export class AuthUserFailRevokeTokenError extends Error {
    constructor(message: string = 'Fail while revoking token') {
        super();
        this.name = 'UserFailRevokeTokenError';
    }
}

export class AuthUserUnexpectedError extends Error {
    constructor(message: string = 'Unexpected error during User operation') {
        super(message);
        this.name = 'UserUnexpectedError';
    }
}

export class AuthTokenVerificationError extends Error {
    constructor(message: string = 'Esrror verifying token operation') {
        super(message);
        this.name = 'TokenVerificationError';
    }
}