import { Document, Types } from "mongoose";
import { IAuthUser } from "../User/IAuthUser";

export interface IBucket{
    user: IAuthUser;
    token: Array<string>;
    lastTimeStamp: Date;
}