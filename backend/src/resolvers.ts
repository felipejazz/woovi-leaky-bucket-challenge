import { Context } from 'koa';
import { AuthController } from './controllers/AuthController';
import { PixController } from './controllers/PixController';
interface RegisterArgs {
  userName: string;
  password: string;
}

interface LoginArgs {
  userName: string;
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
      { userName, password }: RegisterArgs,
      { ctx }: GraphQLContext
    ): Promise<{ errorMessage: string } | { successMessage: string }> => {
      ctx.request.body = { userName, password };
      await AuthController.register(ctx);
      return ctx.body as { errorMessage: string } | { successMessage: string };
    },
    login: async (
      _: unknown,
      { userName, password }: LoginArgs,
      { ctx }: GraphQLContext
    ): Promise<{ token: string } | { message: string }> => {
      ctx.request.body = { userName, password };
      await AuthController.login(ctx);
      return ctx.body as { token: string; message: string };
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
