import { Router } from "express";
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
} from "../controllers/item.controller";
import { validateBody } from "../middleware/validate.middleware";
import { createItemSchema, updateItemSchema } from "../schemas/item.schema";

export const itemsRouter = Router({ mergeParams: true });

itemsRouter.post("/", validateBody(createItemSchema), createItem);
itemsRouter.get("/", listItems);
itemsRouter.put("/:itemId", validateBody(updateItemSchema), updateItem);
itemsRouter.delete("/:itemId", deleteItem);
