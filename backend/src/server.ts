import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors'; 
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
        console.error("Failed to connect to MongoDB");
        process.exit(1);
    }
    const pixWorker = new PixWorker();
    await pixWorker.initialize();
    app.use(cors({
        origin: 'http://felipejazz.com:3001',
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
        allowHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
    }));

    // Configurar cabeçalhos CORS manualmente (opcional)
    app.use(async (ctx, next) => {
        ctx.set('Access-Control-Allow-Origin', 'http://felipejazz.com:3001');
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

    router.post('/auth/register', contextMiddleware, graphqlHTTP((request, response, ctx) => {
        return {
            schema,
            graphiql: true,
            context: { ctx },
        };
    }));

    router.post('/auth/login', contextMiddleware, graphqlHTTP((request, response, ctx) => {
        return {
            schema,
            graphiql: true,
            context: { ctx },
        };
    }));

    router.use(authMiddleware);

    router.all('/graphql', contextMiddleware, graphqlHTTP((request, response, ctx) => {
        return {
            schema,
            graphiql: true,
            context: { ctx },
        };
    }));

    app.use(bodyParser());
    app.use(router.routes()).use(router.allowedMethods());

    app.listen(3000, () => {
        console.log('Server running on http://localhost:3000/graphql');
    });
}

startServer().catch((err) => {
    console.error('Failed to start server:', err);
});

