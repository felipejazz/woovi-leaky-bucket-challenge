import { IResult } from '../interfaces/Result/IResult';

export class Result<T> implements IResult<T> {
  success: boolean;
  data: T | null;
  error?: Error;

  constructor({
    success,
    data,
    error,
  }: {
    success: boolean;
    data: T | null;
    error?: Error;
  }) {
    this.success = success;
    this.data = data;
    this.error = error;
  }
}
