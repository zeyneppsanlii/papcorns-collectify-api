import { RequestHandler } from "express";
import { collectionService } from "../services/collection.service";

export const createCollection: RequestHandler = async (req, res) => {
  const collection = await collectionService.create(req.userId, req.body);
  res.status(201).json(collection);
};

export const listCollections: RequestHandler = async (req, res) => {
  const collections = await collectionService.list(req.userId);
  res.status(200).json(collections);
};

export const getCollection: RequestHandler<{ id: string }> = async (req, res) => {
  const collection = await collectionService.getWithItems(req.userId, req.params.id);
  res.status(200).json(collection);
};

export const updateCollection: RequestHandler<{ id: string }> = async (req, res) => {
  const collection = await collectionService.update(req.userId, req.params.id, req.body);
  res.status(200).json(collection);
};

export const deleteCollection: RequestHandler<{ id: string }> = async (req, res) => {
  await collectionService.remove(req.userId, req.params.id);
  res.status(204).send();
};
