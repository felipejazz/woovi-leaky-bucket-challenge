import { Document } from 'mongoose';
import { Bucket } from '../../models/Bucket';

export interface IDocumentAuthUser extends Document {
    userName: string;
    password?: string;
    token: string;
    bucket?: Bucket;
    revokedTokens?: string[];
    noValidTokens: boolean
}
