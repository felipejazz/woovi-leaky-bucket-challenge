import { IUser } from "../User/IUser";

export interface IBucket{
    user: IUser;
    token: Array<string>;
    lastTimeStamp: Date;
}