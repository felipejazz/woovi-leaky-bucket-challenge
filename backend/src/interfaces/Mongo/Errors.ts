export class FailedConnectMongo extends Error {
    constructor() {
        super('Fail connecting = in mongoDB');
        this.name = 'FailedConnectMongo';
    }
}
export class FailedDisconnectMongo extends Error {
    constructor() {
        super('Fail connecting = in mongoDB');
        this.name = 'FailedConnectMongo';
    }
}