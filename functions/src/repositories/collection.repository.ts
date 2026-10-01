import { Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";
import { AppError } from "../errors/app-error";
import { CollectionDocument, CollectionResponse } from "../types/collection";
import {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "../schemas/collection.schema";

const MAX_COLLECTIONS_PER_USER = 20;

const collections = db.collection("collections");

const normalize = (name: string): string => name.trim().toLowerCase();

const toCollectionResponse = (id: string, data: CollectionDocument): CollectionResponse => {
  return {
    id,
    userId: data.userId,
    name: data.name,
    description: data.description,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
};

const userCollectionsQuery = (userId: string) => collections.where("userId", "==", userId);

export const collectionRepository = {
  async create(userId: string, input: CreateCollectionInput): Promise<CollectionResponse> {
    const ref = collections.doc();

    return db.runTransaction(async (tx) => {
      const existing = await tx.get(userCollectionsQuery(userId));

      if (existing.size >= MAX_COLLECTIONS_PER_USER) {
        throw AppError.limitExceeded(
          `Maximum of ${MAX_COLLECTIONS_PER_USER} collections per user reached`
        );
      }

      const target = normalize(input.name);
      if (existing.docs.some((doc) => normalize(doc.data().name) === target)) {
        throw AppError.conflict("A collection with this name already exists");
      }

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
    const snapshot = await userCollectionsQuery(userId).get();
    return snapshot.docs
      .map((doc) => toCollectionResponse(doc.id, doc.data() as CollectionDocument))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findOwned(userId: string, id: string): Promise<CollectionResponse | null> {
    const snapshot = await collections.doc(id).get();
    if (!snapshot.exists || snapshot.data()?.userId !== userId) {
      return null;
    }
    return toCollectionResponse(snapshot.id, snapshot.data() as CollectionDocument);
  },

  async findItems(id: string): Promise<Record<string, unknown>[]> {
    const snapshot = await collections.doc(id).collection("items").orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => {
      const { createdAt, updatedAt, ...rest } = doc.data();
      return {
        id: doc.id,
        ...rest,
        createdAt: createdAt.toDate().toISOString(),
        updatedAt: updatedAt.toDate().toISOString(),
      };
    });
  },

  async update(
    userId: string,
    id: string,
    input: UpdateCollectionInput
  ): Promise<CollectionResponse | null> {
    const ref = collections.doc(id);

    return db.runTransaction(async (tx) => {
      const [current, all] = await Promise.all([
        tx.get(ref),
        tx.get(userCollectionsQuery(userId)),
      ]);

      if (!current.exists || current.data()?.userId !== userId) {
        return null;
      }

      if (input.name !== undefined) {
        const target = normalize(input.name);
        const duplicate = all.docs.some(
          (doc) => doc.id !== id && normalize(doc.data().name) === target
        );
        if (duplicate) {
          throw AppError.conflict("A collection with this name already exists");
        }
      }

      const changes: Partial<CollectionDocument> = { updatedAt: Timestamp.now() };
      if (input.name !== undefined) changes.name = input.name;
      if (input.description !== undefined) changes.description = input.description;
      tx.update(ref, changes);

      const merged = { ...(current.data() as CollectionDocument), ...changes };
      return toCollectionResponse(id, merged);
    });
  },

  async deleteWithItems(id: string): Promise<void> {
    await db.recursiveDelete(collections.doc(id));
  },
};
