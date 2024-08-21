import {IUser} from "../interfaces/User/IUser";

export class User implements IUser {
    
    username: string;
    password: string;

    constructor({username, password} : {username: string, password: string}) {
        this.username = username;
        this.password = password;
    }


}

