import { Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import {
  ItemDocument,
  ItemPage,
  ItemResponse,
  PersistCreateItem,
  PersistItemRef,
  PersistListItems,
  PersistUpdateItem,
} from "../types/item";

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
  async create({ userId, collectionId, input }: PersistCreateItem): Promise<ItemResponse> {
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

  async findPage({ collectionId, query }: PersistListItems): Promise<ItemPage | null> {
    let ref: FirebaseFirestore.Query = itemsOf(collectionId);

    if (query.priority) {
      ref = ref.where("priority", "==", query.priority);
    }
    ref = ref.orderBy("createdAt", "desc");

    if (query.cursor) {
      const cursorSnapshot = await itemsOf(collectionId).doc(query.cursor).get();
      if (!cursorSnapshot.exists) {
        return null;
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

  async update({
    collectionId,
    itemId,
    input,
  }: PersistUpdateItem): Promise<ItemResponse | null> {
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

  async delete({ collectionId, itemId }: PersistItemRef): Promise<boolean> {
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
