import { Bucket } from '../../models/Bucket';

export interface IAuthUser{
    
    userName: string;
    password: string;
    token: string ;
    bucket?: Bucket;
    revokedTokens?: string[];
    

}
