import { AppError } from "../errors/app-error";
import { collectionRepository } from "../repositories/collection.repository";
import {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "../schemas/collection.schema";
import { CollectionResponse, CollectionWithItems } from "../types/collection";

const requireOwned = async (userId: string, id: string): Promise<CollectionResponse> => {
  const collection = await collectionRepository.findOwned(userId, id);
  if (!collection) {
    throw AppError.notFound("Collection not found");
  }
  return collection;
};

export const collectionService = {
  create: (userId: string, input: CreateCollectionInput) =>
    collectionRepository.create(userId, input),

  list: (userId: string) => collectionRepository.findAllByUser(userId),

  async getWithItems(userId: string, id: string): Promise<CollectionWithItems> {
    const collection = await requireOwned(userId, id);
    const items = await collectionRepository.findItems(id);
    return { ...collection, items };
  },

  async update(userId: string, id: string, input: UpdateCollectionInput) {
    const updated = await collectionRepository.update(userId, id, input);
    if (!updated) {
      throw AppError.notFound("Collection not found");
    }
    return updated;
  },

  async remove(userId: string, id: string): Promise<void> {
    await requireOwned(userId, id);
    await collectionRepository.deleteWithItems(id);
  },
};
