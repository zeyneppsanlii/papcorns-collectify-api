import { Router } from "express";
import {
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  updateCollection,
} from "../controllers/collection.controller";
import { validateBody } from "../middleware/validate.middleware";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../schemas/collection.schema";

export const collectionsRouter = Router();

collectionsRouter.post("/", validateBody(createCollectionSchema), createCollection);
collectionsRouter.get("/", listCollections);
collectionsRouter.get("/:id", getCollection);
collectionsRouter.put("/:id", validateBody(updateCollectionSchema), updateCollection);
collectionsRouter.delete("/:id", deleteCollection);
