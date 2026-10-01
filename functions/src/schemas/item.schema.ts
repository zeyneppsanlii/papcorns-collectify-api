import { z } from "zod";

const title = z.string().trim().min(3).max(100);
const content = z.string().trim().max(5000);
const url = z.url().max(2048);
const tags = z.array(z.string().trim().min(1).max(50)).max(20);
const priority = z.enum(["low", "medium", "high"]);

export const createItemSchema = z.strictObject({
  title,
  content: content.default(""),
  url: url.optional(),
  imageUrl: url.optional(),
  tags: tags.default([]),
  priority: priority.default("medium"),
});

export const updateItemSchema = z
  .strictObject({
    title: title.optional(),
    content: content.optional(),
    url: url.optional(),
    imageUrl: url.optional(),
    tags: tags.optional(),
    priority: priority.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
