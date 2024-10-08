import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import { graphqlHTTP } from 'koa-graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { authMiddleware } from './middlewares/authMiddleware';
import { resolvers } from './resolvers';
import { typeDefs } from './schema';
import { UserService } from './services/UserService';
import RedisService from './services/RedisService';
import PixWorker from './workers/PixWorker';

async function startServer() {
  const app = new Koa();
  const router = new Router();
  await RedisService.initialize();

  const mongoConnectionResult = await UserService.connectMongo();
  if (!mongoConnectionResult.success) {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to MongoDB');
    process.exit(1);
  }
  const pixWorker = new PixWorker();
  await pixWorker.initialize();
  const WEBSITE_URL = process.env.WEBSITE_URL;
  if (!WEBSITE_URL) {
    throw new Error('WEBSITE URL MUST BE PROVIDED');
  }

  app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', WEBSITE_URL);
    ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
    } else {
      await next();
    }
  });
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const contextMiddleware = async (ctx: Koa.Context, next: Koa.Next) => {
    ctx.state.context = { ctx };
    await next();
  };

  router.post(
    '/auth/register',
    contextMiddleware,
    graphqlHTTP((request, response, ctx) => {
      return {
        schema,
        graphiql: true,
        context: { ctx },
      };
    })
  );

  router.post(
    '/auth/login',
    contextMiddleware,
    graphqlHTTP((request, response, ctx) => {
      return {
        schema,
        graphiql: true,
        context: { ctx },
      };
    })
  );

  router.use(authMiddleware);

  router.all(
    '/graphql',
    contextMiddleware,
    graphqlHTTP((request, response, ctx) => {
      return {
        schema,
        graphiql: true,
        context: { ctx },
      };
    })
  );

  app.use(bodyParser());
  app.use(router.routes()).use(router.allowedMethods());

  app.listen(3000, () => {
    // eslint-disable-next-line no-console
    console.log('Server running on http://localhost:3000/graphql');
  });
}

startServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
});
