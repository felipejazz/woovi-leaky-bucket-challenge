import { Document, ObjectId, Types } from 'mongoose';
import { Bucket } from '../../models/Bucket';
import { IAuthUser } from '../User/IAuthUser';

export interface IDocumentBucket extends Document {
    userName: string
    tokens: Array<string>
    lastTimeStamp: Date;

}
