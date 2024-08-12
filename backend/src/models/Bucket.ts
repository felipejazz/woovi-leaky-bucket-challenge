import { IBucket } from "../interfaces/Bucket/IBucket";
import { IDecodedJWT } from "../interfaces/IDecodedJWT";
import { AuthUser } from "./AuthUser";

export class Bucket implements IBucket {
    tokens: Array<string>;
    user: AuthUser;
    intervalId: NodeJS.Timeout | null;
    serviceStarted : boolean | null

    constructor(user: AuthUser) {
        this.tokens = [];
        this.user = user
        this.intervalId = null;
        this.serviceStarted = null
    }

    getTokenCount(): number {
        return this.tokens.length;
    }


}