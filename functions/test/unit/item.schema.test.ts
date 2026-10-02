import {
  createItemSchema,
  listItemsQuerySchema,
  updateItemSchema,
} from "../../src/schemas/item.schema";

describe("createItemSchema", () => {
  it("applies defaults for optional fields", () => {
    const result = createItemSchema.parse({ title: "Menemen" });

    expect(result).toEqual({ title: "Menemen", content: "", tags: [], priority: "medium" });
  });

  it.each(["ab", "a".repeat(101), "  ab  "])("rejects invalid title %j", (title) => {
    expect(createItemSchema.safeParse({ title }).success).toBe(false);
  });

  it("accepts titles on the 3 and 100 character boundaries", () => {
    expect(createItemSchema.safeParse({ title: "abc" }).success).toBe(true);
    expect(createItemSchema.safeParse({ title: "a".repeat(100) }).success).toBe(true);
  });

  it("rejects unknown priority, invalid urls and unknown fields", () => {
    expect(createItemSchema.safeParse({ title: "Menemen", priority: "urgent" }).success).toBe(false);
    expect(createItemSchema.safeParse({ title: "Menemen", url: "nope" }).success).toBe(false);
    expect(createItemSchema.safeParse({ title: "Menemen", extra: 1 }).success).toBe(false);
  });
});

describe("updateItemSchema", () => {
  it("requires at least one field", () => {
    expect(updateItemSchema.safeParse({}).success).toBe(false);
    expect(updateItemSchema.safeParse({ priority: "high" }).success).toBe(true);
  });
});

describe("listItemsQuerySchema", () => {
  it("coerces limit and applies the default", () => {
    expect(listItemsQuerySchema.parse({}).limit).toBe(20);
    expect(listItemsQuerySchema.parse({ limit: "5" }).limit).toBe(5);
  });

  it.each(["0", "101", "abc"])("rejects limit %s", (limit) => {
    expect(listItemsQuerySchema.safeParse({ limit }).success).toBe(false);
  });
});
