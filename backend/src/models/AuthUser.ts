
import { IAuthUser } from "../interfaces/User/IAuthUser";
import { Bucket } from "./Bucket";

export class AuthUser implements IAuthUser {
    
    id: string;
    username: string;
    password: string;
    bucket: Bucket;
    token: string

    constructor({id, username, password, token} : {id: string, username: string, password: string, token: string}) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.token = token;
        this.bucket = new Bucket(this)
    }


}

