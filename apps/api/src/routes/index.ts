import { Router } from 'express';
import healthRouter from './health';
import savedSearchesRouter from './savedSearches';
import listingsRouter from './listings';
import alertsRouter from './alerts';

const router: ReturnType<typeof Router> = Router();

router.use(healthRouter);
router.use('/api/saved-searches', savedSearchesRouter);
router.use('/api/listings', listingsRouter);
router.use('/api/alerts', alertsRouter);

export default router;
