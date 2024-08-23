export class UpdateUserError extends Error {
    constructor(message: string = 'Fail creating user in mongoDB') {
        super();
        this.name = 'FailedUpdateUserError';
    }
}
export class FailedCreateUserError extends Error {
    constructor(message: string = 'Fail creating user in mongoDB') {
        super();
        this.name = 'FailedCreateUserError';
    }
}

export class UserNotFoundError extends Error {
    constructor(message: string = 'User not found in the MongoDB') {
        super(message);
        this.name = 'UserNotFoundError';
    }
}


export class UserUnexpectedError extends Error {
    constructor(message: string = 'Unexpected error during User operation') {
        super(message);
        this.name = 'UserUnexpectedError';
    }
}
