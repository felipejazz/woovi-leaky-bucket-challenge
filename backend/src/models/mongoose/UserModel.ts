import mongoose, { Schema } from 'mongoose';
import { IDocumentUser } from '../../interfaces/User/IDocumentUser';

const userSchema = new Schema(
  {
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String, required: true },
    bucket: { type: Schema.Types.ObjectId, ref: 'Bucket' },
    noValidTokens: { type: Boolean, default: false },
  },
  {
    collection: 'Users',
  }
);

export const UserModel = mongoose.model<IDocumentUser>('User', userSchema);
