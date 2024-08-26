import { Document } from 'mongoose';
import { IDocumentBucket } from '../Bucket/IDocumentBucket';

export interface IDocumentUser extends Document {
  userName: string;
  password?: string;
  token: string;
  bucket?: IDocumentBucket;
}
