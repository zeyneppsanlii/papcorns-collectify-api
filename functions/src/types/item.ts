import { CreateItemInput, ListItemsQuery, UpdateItemInput } from "../schemas/item.schema";

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

export interface ItemCollectionCommand {
  userId: string;
  collectionId: string;
}

export interface CreateItemCommand extends ItemCollectionCommand {
  input: CreateItemInput;
}

export interface ListItemsCommand extends ItemCollectionCommand {
  query: ListItemsQuery;
}

export interface ItemRefCommand extends ItemCollectionCommand {
  itemId: string;
}

export interface UpdateItemCommand extends ItemRefCommand {
  input: UpdateItemInput;
}

export interface PersistItemRef {
  collectionId: string;
  itemId: string;
}

export interface PersistCreateItem {
  userId: string;
  collectionId: string;
  input: CreateItemInput;
}

export interface PersistUpdateItem extends PersistItemRef {
  input: UpdateItemInput;
}

export interface PersistListItems {
  collectionId: string;
  query: ListItemsQuery;
}
