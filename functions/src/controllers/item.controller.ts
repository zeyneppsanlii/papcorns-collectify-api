import { RequestHandler } from "express";
import { itemService } from "../services/item.service";

interface CollectionParams {
  collectionId: string;
}

interface ItemParams extends CollectionParams {
  itemId: string;
}

export const createItem: RequestHandler<CollectionParams> = async (req, res) => {
  const item = await itemService.create({
    userId: req.userId,
    collectionId: req.params.collectionId,
    input: req.body,
  });
  res.status(201).json(item);
};

export const listItems: RequestHandler<CollectionParams> = async (req, res) => {
  const page = await itemService.list({
    userId: req.userId,
    collectionId: req.params.collectionId,
    query: res.locals.query,
  });
  res.status(200).json(page);
};

export const updateItem: RequestHandler<ItemParams> = async (req, res) => {
  const item = await itemService.update({
    userId: req.userId,
    collectionId: req.params.collectionId,
    itemId: req.params.itemId,
    input: req.body,
  });
  res.status(200).json(item);
};

export const deleteItem: RequestHandler<ItemParams> = async (req, res) => {
  await itemService.remove({
    userId: req.userId,
    collectionId: req.params.collectionId,
    itemId: req.params.itemId,
  });
  res.status(204).send();
};
