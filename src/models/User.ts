import {IUser} from "../interfaces/User/IUser";

export class User implements IUser {
    
    id: string;
    username: string;
    password: string;
    token?: string

    constructor({id, username, password} : {id: string, username: string, password: string}) {
        this.id = id;
        this.username = username;
        this.password = password;
    }


}

