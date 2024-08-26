export class UpdateUserError extends Error {
  constructor(message: string = 'Fail creating user in mongoDB') {
    super(message);
    this.name = 'FailedUpdateUserError';
    this.message = message;
  }
}
export class FailedCreateUserError extends Error {
  constructor(message: string = 'Fail creating user in mongoDB') {
    super(message);
    this.name = 'FailedCreateUserError';
    this.message = message;
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string = 'User not found in the MongoDB') {
    super(message);
    this.name = 'UserNotFoundError';
    this.message = message;
  }
}

export class UserUnexpectedError extends Error {
  constructor(message: string = 'Unexpected error during User operation') {
    super(message);
    this.name = 'UserUnexpectedError';
    this.message = message;
  }
}
