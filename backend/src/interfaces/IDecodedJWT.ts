export interface IDecodedJWT {
    user: string;
    iat?: number; 
    exp?: number;
}
