import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validateDocumentId } from "../middleware/validate.middleware";
import { collectionsRouter } from "./collections.routes";
import { healthRouter } from "./health.routes";
import { itemsRouter } from "./items.routes";

export const router = Router();

router.use(healthRouter);
router.use(authenticate);
router.param("collectionId", validateDocumentId);
router.use("/collections", collectionsRouter);
router.use("/collections/:collectionId/items", itemsRouter);
