import { AppError } from "../errors/app-error";
import { collectionRepository } from "../repositories/collection.repository";
import { itemRepository } from "../repositories/item.repository";
import { CreateItemInput, ListItemsQuery, UpdateItemInput } from "../schemas/item.schema";

const requireOwnedCollection = async (userId: string, collectionId: string): Promise<void> => {
  const collection = await collectionRepository.findOwned(userId, collectionId);
  if (!collection) {
    throw AppError.notFound("Collection not found");
  }
};

export const itemService = {
  async create(userId: string, collectionId: string, input: CreateItemInput) {
    await requireOwnedCollection(userId, collectionId);
    return itemRepository.create(userId, collectionId, input);
  },

  async list(userId: string, collectionId: string, query: ListItemsQuery) {
    await requireOwnedCollection(userId, collectionId);
    return itemRepository.findPage(collectionId, query);
  },

  async update(userId: string, collectionId: string, itemId: string, input: UpdateItemInput) {
    await requireOwnedCollection(userId, collectionId);
    const updated = await itemRepository.update(collectionId, itemId, input);
    if (!updated) {
      throw AppError.notFound("Item not found");
    }
    return updated;
  },

  async remove(userId: string, collectionId: string, itemId: string): Promise<void> {
    await requireOwnedCollection(userId, collectionId);
    const deleted = await itemRepository.delete(collectionId, itemId);
    if (!deleted) {
      throw AppError.notFound("Item not found");
    }
  },
};
