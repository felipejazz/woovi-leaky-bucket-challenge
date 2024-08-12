import { Bucket } from '../../models/Bucket';

export interface IAuthUser {
    id: string;
    username: string;
    password: string;
    token: string ;
    bucket: Bucket;

}
