import { Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import { CreateItemInput, ListItemsQuery, UpdateItemInput } from "../schemas/item.schema";
import { AppError } from "../errors/app-error";
import { ItemDocument, ItemPage, ItemResponse } from "../types/item";

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

  async findPage(collectionId: string, query: ListItemsQuery): Promise<ItemPage> {
    let ref: FirebaseFirestore.Query = itemsOf(collectionId);

    if (query.priority) {
      ref = ref.where("priority", "==", query.priority);
    }
    ref = ref.orderBy("createdAt", "desc");

    if (query.cursor) {
      const cursorSnapshot = await itemsOf(collectionId).doc(query.cursor).get();
      if (!cursorSnapshot.exists) {
        throw AppError.validation([{ path: ["cursor"], message: "Invalid cursor" }]);
      }
      ref = ref.startAfter(cursorSnapshot);
    }

    const snapshot = await ref.limit(query.limit + 1).get();
    const hasMore = snapshot.size > query.limit;
    const pageDocs = hasMore ? snapshot.docs.slice(0, query.limit) : snapshot.docs;

    return {
      items: pageDocs.map((doc) => toItemResponse(doc.id, doc.data() as ItemDocument)),
      nextCursor: hasMore ? pageDocs[pageDocs.length - 1].id : null,
    };
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
