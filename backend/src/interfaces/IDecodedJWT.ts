export interface IDecodedJWT {
    id: string;
    user: string;
    iat?: number; 
    exp?: number;
}
