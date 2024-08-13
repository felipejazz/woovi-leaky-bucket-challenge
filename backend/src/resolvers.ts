import { AuthService } from './services/AuthService';
import { PixService } from './services/PixService';
import { BucketService } from './services/BucketService';
import { Context } from 'koa';
import { User } from './models/User';
import { AuthUser } from './models/AuthUser';
import { IAuthUser } from './interfaces/User/IAuthUser';
import { AuthController } from './controllers/AuthController';
import { PixController } from './controllers/PixController';
interface RegisterArgs {
  username: string;
  password: string;
}

interface LoginArgs {
  username: string;
  password: string;
}

interface SimulatePixQueryArgs {
  key: string;
  value: number;
}

interface GraphQLContext {
  ctx: Context;
}


export const resolvers = {
  Mutation: {
    register: async (
      _: unknown,
      { username, password }: RegisterArgs,
      { ctx }: GraphQLContext
    ): Promise<{ errorMessage: string } | { successMessage: string }> => {
      ctx.request.body = { username, password };
      await AuthController.register(ctx);
      return ctx.body as { errorMessage: string } | { successMessage: string };
    },
    login: async (
      _: unknown,
      { username, password }: LoginArgs,
      { ctx }: GraphQLContext
    ): Promise<{ token: string } | { message: string }> => {
      ctx.request.body = { username, password };
      await AuthController.login(ctx);
      return ctx.body as { token: string; message: string };
    },
    logout: async (
      _: unknown,
      __: unknown,
      { ctx }: GraphQLContext
    ): Promise<string | { message: string }> => {
      await AuthController.logout(ctx);
      return (ctx.body as { message: string }).message;
    },
    simulatePixQuery: async (
      _: unknown,
      { key, value }: SimulatePixQueryArgs,
      { ctx }: GraphQLContext
    ): Promise<{ message: string; tokensLeft: number }> => {
      const mockCtx = {
        state: ctx.state,
        request: {
          body: { key, value },
        },
        status: null,
        body: null,
      } as unknown as Context;

      await PixController.simulatePixQuery(mockCtx);
      return mockCtx.body as { message: string; tokensLeft: number };
    },
  },
};
