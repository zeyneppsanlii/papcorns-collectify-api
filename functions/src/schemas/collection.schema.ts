import { z } from "zod";

const name = z.string().trim().min(1).max(100);
const description = z.string().trim().max(500);

export const createCollectionSchema = z.strictObject({
  name,
  description: description.default(""),
});

export const updateCollectionSchema = z
  .strictObject({
    name: name.optional(),
    description: description.optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one of name or description is required",
  });

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
