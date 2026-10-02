import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../../src/schemas/collection.schema";

describe("createCollectionSchema", () => {
  it("trims the name and defaults the description", () => {
    expect(createCollectionSchema.parse({ name: "  Recipes  " })).toEqual({
      name: "Recipes",
      description: "",
    });
  });

  it("rejects empty and overly long values", () => {
    expect(createCollectionSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(createCollectionSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
    expect(
      createCollectionSchema.safeParse({ name: "Recipes", description: "a".repeat(501) }).success
    ).toBe(false);
  });
});

describe("updateCollectionSchema", () => {
  it("requires at least one field", () => {
    expect(updateCollectionSchema.safeParse({}).success).toBe(false);
    expect(updateCollectionSchema.safeParse({ description: "new" }).success).toBe(true);
  });
});
