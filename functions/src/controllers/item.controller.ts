import { RequestHandler } from "express";
import { itemService } from "../services/item.service";

interface CollectionParams {
  collectionId: string;
}

interface ItemParams extends CollectionParams {
  itemId: string;
}

export const createItem: RequestHandler<CollectionParams> = async (req, res) => {
  const item = await itemService.create(req.userId, req.params.collectionId, req.body);
  res.status(201).json(item);
};

export const listItems: RequestHandler<CollectionParams> = async (req, res) => {
  const page = await itemService.list(req.userId, req.params.collectionId, res.locals.query);
  res.status(200).json(page);
};

export const updateItem: RequestHandler<ItemParams> = async (req, res) => {
  const { collectionId, itemId } = req.params;
  const item = await itemService.update(req.userId, collectionId, itemId, req.body);
  res.status(200).json(item);
};

export const deleteItem: RequestHandler<ItemParams> = async (req, res) => {
  const { collectionId, itemId } = req.params;
  await itemService.remove(req.userId, collectionId, itemId);
  res.status(204).send();
};
