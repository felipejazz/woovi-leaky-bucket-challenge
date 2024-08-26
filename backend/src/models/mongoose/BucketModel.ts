import mongoose, { Schema } from 'mongoose';
import { IDocumentBucket } from '../../interfaces/Bucket/IDocumentBucket';

const bucketSchema = new Schema(
  {
    userName: { type: String, required: true },
    tokens: { type: [String], required: true, default: [] },
    revokedTokens: { type: [String], required: true, default: [] },
    lastTimeStamp: { type: Date, required: true, default: Date.now },
    outOfTokens: { type: Boolean, required: true, default: false },
  },
  {
    collection: 'Buckets',
  }
);

export const BucketModel = mongoose.model<IDocumentBucket>(
  'Bucket',
  bucketSchema
);
