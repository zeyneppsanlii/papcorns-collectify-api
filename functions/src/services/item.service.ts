import { AppError } from "../errors/app-error";
import { collectionRepository } from "../repositories/collection.repository";
import { itemRepository } from "../repositories/item.repository";
import {
  CreateItemCommand,
  ItemCollectionCommand,
  ItemRefCommand,
  ItemResponse,
  ListItemsCommand,
  UpdateItemCommand,
} from "../types/item";

const requireOwnedCollection = async ({
  userId,
  collectionId,
}: ItemCollectionCommand): Promise<void> => {
  const collection = await collectionRepository.findOwned({ userId, id: collectionId });
  if (!collection) {
    throw AppError.notFound("Collection not found");
  }
};

export const itemService = {
  async create({ userId, collectionId, input }: CreateItemCommand): Promise<ItemResponse> {
    const created = await itemRepository.createInOwnedCollection({ userId, collectionId, input });
    if (!created) {
      throw AppError.notFound("Collection not found");
    }
    return created;
  },

  async list({ userId, collectionId, query }: ListItemsCommand) {
    await requireOwnedCollection({ userId, collectionId });
    const page = await itemRepository.findPage({ collectionId, query });
    if (!page) {
      throw AppError.validation([{ path: ["cursor"], message: "Invalid cursor" }]);
    }
    return page;
  },

  async update({ userId, collectionId, itemId, input }: UpdateItemCommand): Promise<ItemResponse> {
    await requireOwnedCollection({ userId, collectionId });
    const updated = await itemRepository.update({ collectionId, itemId, input });
    if (!updated) {
      throw AppError.notFound("Item not found");
    }
    return updated;
  },

  async remove({ userId, collectionId, itemId }: ItemRefCommand): Promise<void> {
    await requireOwnedCollection({ userId, collectionId });
    const deleted = await itemRepository.delete({ collectionId, itemId });
    if (!deleted) {
      throw AppError.notFound("Item not found");
    }
  },
};
