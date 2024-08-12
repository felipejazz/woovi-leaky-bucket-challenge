import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import { authMiddleware } from './middlewares/authMiddleware';
import { PixController } from './controllers/PixController';
import { AuthController } from './controllers/AuthController';

const app = new Koa();
const router = new Router();

router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/logout', authMiddleware, AuthController.logout);
router.post('/pix/query', authMiddleware, PixController.simulatePixQuery);

app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

export default app;
