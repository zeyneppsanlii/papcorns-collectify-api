import { Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import {
  CollectionDocument,
  CollectionRefCommand,
  CollectionResponse,
  GuardedCreateCollectionCommand,
  GuardedUpdateCollectionCommand,
} from "../types/collection";

const collections = db.collection("collections");

const toCollectionResponse = (id: string, data: CollectionDocument): CollectionResponse => ({
  id,
  userId: data.userId,
  name: data.name,
  description: data.description,
  createdAt: data.createdAt.toDate().toISOString(),
  updatedAt: data.updatedAt.toDate().toISOString(),
});

const toResponses = (snapshot: FirebaseFirestore.QuerySnapshot): CollectionResponse[] =>
  snapshot.docs.map((doc) => toCollectionResponse(doc.id, doc.data() as CollectionDocument));

const userCollectionsQuery = (userId: string) => collections.where("userId", "==", userId);

export const collectionRepository = {
  async createGuarded({ userId, input, guard }: GuardedCreateCollectionCommand) {
    const ref = collections.doc();

    return db.runTransaction(async (tx) => {
      guard(toResponses(await tx.get(userCollectionsQuery(userId))));

      const now = Timestamp.now();
      const document: CollectionDocument = {
        userId,
        name: input.name,
        description: input.description,
        createdAt: now,
        updatedAt: now,
      };
      tx.create(ref, document);

      return toCollectionResponse(ref.id, document);
    });
  },

  async findAllByUser(userId: string): Promise<CollectionResponse[]> {
    const responses = toResponses(await userCollectionsQuery(userId).get());
    return responses.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findOwned({ userId, id }: CollectionRefCommand): Promise<CollectionResponse | null> {
    const snapshot = await collections.doc(id).get();
    if (!snapshot.exists || snapshot.data()?.userId !== userId) {
      return null;
    }
    return toCollectionResponse(snapshot.id, snapshot.data() as CollectionDocument);
  },

  async updateGuarded({
    userId,
    id,
    input,
    guard,
  }: GuardedUpdateCollectionCommand): Promise<CollectionResponse | null> {
    const ref = collections.doc(id);

    return db.runTransaction(async (tx) => {
      const [current, all] = await Promise.all([
        tx.get(ref),
        tx.get(userCollectionsQuery(userId)),
      ]);

      if (!current.exists || current.data()?.userId !== userId) {
        return null;
      }

      guard(toResponses(all));

      const changes: Partial<CollectionDocument> = { updatedAt: Timestamp.now() };
      if (input.name !== undefined) changes.name = input.name;
      if (input.description !== undefined) changes.description = input.description;
      tx.update(ref, changes);

      return toCollectionResponse(id, { ...(current.data() as CollectionDocument), ...changes });
    });
  },

  async deleteWithItems(id: string): Promise<void> {
    await db.recursiveDelete(collections.doc(id));
  },
};
