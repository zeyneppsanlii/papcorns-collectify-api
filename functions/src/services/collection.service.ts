import { AppError } from "../errors/app-error";
import { collectionRepository } from "../repositories/collection.repository";
import { itemRepository } from "../repositories/item.repository";
import {
  CollectionGuard,
  CollectionRefCommand,
  CollectionResponse,
  CollectionWithItems,
  CreateCollectionCommand,
  ListCollectionsCommand,
  UpdateCollectionCommand,
} from "../types/collection";

const MAX_COLLECTIONS_PER_USER = 20;

const normalizeName = (name: string): string => name.trim().toLowerCase();

const isNameTaken = (existing: CollectionResponse[], name: string, excludeId?: string): boolean => {
  const target = normalizeName(name);
  return existing.some((c) => c.id !== excludeId && normalizeName(c.name) === target);
};

const creationRules =
  (name: string): CollectionGuard =>
  (existing) => {
    if (existing.length >= MAX_COLLECTIONS_PER_USER) {
      throw AppError.limitExceeded(
        `Maximum of ${MAX_COLLECTIONS_PER_USER} collections per user reached`
      );
    }
    if (isNameTaken(existing, name)) {
      throw AppError.conflict("A collection with this name already exists");
    }
  };

const renameRules =
  (id: string, name: string | undefined): CollectionGuard =>
  (existing) => {
    if (name !== undefined && isNameTaken(existing, name, id)) {
      throw AppError.conflict("A collection with this name already exists");
    }
  };

const requireOwned = async (command: CollectionRefCommand): Promise<CollectionResponse> => {
  const collection = await collectionRepository.findOwned(command);
  if (!collection) {
    throw AppError.notFound("Collection not found");
  }
  return collection;
};

export const collectionService = {
  create: ({ userId, input }: CreateCollectionCommand) =>
    collectionRepository.createGuarded({ userId, input, guard: creationRules(input.name) }),

  list: ({ userId }: ListCollectionsCommand) => collectionRepository.findAllByUser(userId),

  async getWithItems(command: CollectionRefCommand): Promise<CollectionWithItems> {
    const collection = await requireOwned(command);
    const items = await itemRepository.findAllByCollection(command.id);
    return { ...collection, items };
  },

  async update({ userId, id, input }: UpdateCollectionCommand): Promise<CollectionResponse> {
    const updated = await collectionRepository.updateGuarded({
      userId,
      id,
      input,
      guard: renameRules(id, input.name),
    });
    if (!updated) {
      throw AppError.notFound("Collection not found");
    }
    return updated;
  },

  async remove(command: CollectionRefCommand): Promise<void> {
    await requireOwned(command);
    await collectionRepository.deleteWithItems(command.id);
  },
};
