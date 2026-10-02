import { CreateCollectionInput, UpdateCollectionInput } from "../schemas/collection.schema";
import { ItemResponse } from "./item";

export interface CollectionDocument {
  userId: string;
  name: string;
  description: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CollectionResponse {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionWithItems extends CollectionResponse {
  items: ItemResponse[];
}

export type CollectionGuard = (existing: CollectionResponse[]) => void;

export interface ListCollectionsCommand {
  userId: string;
}

export interface CollectionRefCommand {
  userId: string;
  id: string;
}

export interface CreateCollectionCommand {
  userId: string;
  input: CreateCollectionInput;
}

export interface UpdateCollectionCommand extends CollectionRefCommand {
  input: UpdateCollectionInput;
}

export interface GuardedCreateCollectionCommand extends CreateCollectionCommand {
  guard: CollectionGuard;
}

export interface GuardedUpdateCollectionCommand extends UpdateCollectionCommand {
  guard: CollectionGuard;
}
