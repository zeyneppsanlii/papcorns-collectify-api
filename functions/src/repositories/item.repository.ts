import { Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import { CreateItemInput, UpdateItemInput } from "../schemas/item.schema";
import { ItemDocument, ItemResponse } from "../types/item";

const itemsOf = (collectionId: string) =>
  db.collection("collections").doc(collectionId).collection("items");

const withoutUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;

const toItemResponse = (id: string, data: ItemDocument): ItemResponse => ({
  ...data,
  id,
  createdAt: data.createdAt.toDate().toISOString(),
  updatedAt: data.updatedAt.toDate().toISOString(),
});

export const itemRepository = {
  async create(
    userId: string,
    collectionId: string,
    input: CreateItemInput
  ): Promise<ItemResponse> {
    const ref = itemsOf(collectionId).doc();
    const now = Timestamp.now();
    const document: ItemDocument = withoutUndefined({
      collectionId,
      userId,
      ...input,
      createdAt: now,
      updatedAt: now,
    });
    await ref.create(document);
    return toItemResponse(ref.id, document);
  },

  async findAllByCollection(collectionId: string): Promise<ItemResponse[]> {
    const snapshot = await itemsOf(collectionId).orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => toItemResponse(doc.id, doc.data() as ItemDocument));
  },

  async update(
    collectionId: string,
    itemId: string,
    input: UpdateItemInput
  ): Promise<ItemResponse | null> {
    const ref = itemsOf(collectionId).doc(itemId);

    return db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (!current.exists) {
        return null;
      }

      const changes = withoutUndefined({ ...input, updatedAt: Timestamp.now() });
      tx.update(ref, changes);

      return toItemResponse(itemId, { ...(current.data() as ItemDocument), ...changes });
    });
  },

  async delete(collectionId: string, itemId: string): Promise<boolean> {
    const ref = itemsOf(collectionId).doc(itemId);

    return db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (!current.exists) {
        return false;
      }
      tx.delete(ref);
      return true;
    });
  },
};
