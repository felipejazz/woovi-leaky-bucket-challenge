
import { IAuthUser } from "../interfaces/User/IAuthUser";
import { Bucket } from "./Bucket";

export class AuthUser implements IAuthUser {
    
    userName: string;
    password: string;
    bucket?: Bucket;
    token: string
    revokedTokens?: string[]

    constructor({userName, password, token} : {userName: string, password: string, token: string}) {
        this.userName = userName;
        this.password = password;
        this.token = token;
    }


}

