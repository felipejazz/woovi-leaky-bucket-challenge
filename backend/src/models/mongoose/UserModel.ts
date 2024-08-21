import mongoose, { Schema } from 'mongoose';
import { IAuthUser } from '../../interfaces/User/IAuthUser';
import { IDocumentAuthUser } from '../../interfaces/User/IDocumentAuthUser';


const userSchema = new Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String, required: true },
    bucket: { type: Schema.Types.ObjectId, ref: 'Bucket' },
    revokedTokens: [{ type: String }],
    noValidTokens: { type: Boolean, default: false }

}, {
    collection:'Users'
});

export const UserModel = mongoose.model<IDocumentAuthUser>('User', userSchema);
