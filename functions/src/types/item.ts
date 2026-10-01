export type ItemPriority = "low" | "medium" | "high";

export interface ItemDocument {
  collectionId: string;
  userId: string;
  title: string;
  content: string;
  url?: string;
  imageUrl?: string;
  tags: string[];
  priority: ItemPriority;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ItemResponse extends Omit<ItemDocument, "createdAt" | "updatedAt"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemPage {
  items: ItemResponse[];
  nextCursor: string | null;
}
