export interface IResult<T> {
    success: boolean;
    data: T | null;
    error?: Error;
}
