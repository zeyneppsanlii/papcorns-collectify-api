import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { collectionsRouter } from "./collections.routes";
import { healthRouter } from "./health.routes";

export const router = Router();

router.use(healthRouter);
router.use(authenticate);
router.use("/collections", collectionsRouter);
