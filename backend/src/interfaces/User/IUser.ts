import { IBucket } from '../Bucket/IBucket';

export interface IUser {
  userName: string;
  password: string;
  token: string;
  bucket?: IBucket;
  revokedTokens?: string[];
}
