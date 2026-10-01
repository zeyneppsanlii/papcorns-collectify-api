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
