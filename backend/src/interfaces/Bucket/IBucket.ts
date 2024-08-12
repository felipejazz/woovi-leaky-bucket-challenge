import { User } from "../../models/User";

export interface IBucket {
    user: User;
    tokens: Array<string>
    intervalId: NodeJS.Timeout | null;
    serviceStarted : boolean | null;
    getTokenCount(): number;
}