
import { AuthUser } from "./AuthUser";
import { Document } from "mongoose";

export class Bucket {
    tokens: Array<string>;
    user: AuthUser;
    intervalId: NodeJS.Timeout | null;
    serviceStarted : boolean 

    constructor(user: AuthUser) {
        this.tokens = [];
        this.user = user
        this.intervalId = null;
        this.serviceStarted = false
    }
}