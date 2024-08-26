import { Document } from 'mongoose';

export interface IDocumentBucket extends Document {
  userName: string;
  tokens: Array<string>;
  revokedTokens: Array<string>;
  lastTimeStamp: Date;
  outOfTokens: boolean;
}
