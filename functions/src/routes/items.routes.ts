import { Router } from "express";
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
} from "../controllers/item.controller";
import { validateBody, validateDocumentId, validateQuery } from "../middleware/validate.middleware";
import {
  createItemSchema,
  listItemsQuerySchema,
  updateItemSchema,
} from "../schemas/item.schema";

export const itemsRouter = Router({ mergeParams: true });

itemsRouter.param("itemId", validateDocumentId);

itemsRouter.post("/", validateBody(createItemSchema), createItem);
itemsRouter.get("/", validateQuery(listItemsQuerySchema), listItems);
itemsRouter.put("/:itemId", validateBody(updateItemSchema), updateItem);
itemsRouter.delete("/:itemId", deleteItem);
