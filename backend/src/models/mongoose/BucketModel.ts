import mongoose, { Schema } from 'mongoose';

const bucketSchema = new Schema({
    userName: { type: String, required: true },
    tokens: { type: [String], required: true },
    lastTimeStamp: { type: Date, default: Date.now },
});

export const BucketModel = mongoose.model('Bucket', bucketSchema);