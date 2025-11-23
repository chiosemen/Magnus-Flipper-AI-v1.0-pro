import { Router } from 'express';
import healthRouter from './health';

const router: ReturnType<typeof Router> = Router();

router.use(healthRouter);

export default router;
