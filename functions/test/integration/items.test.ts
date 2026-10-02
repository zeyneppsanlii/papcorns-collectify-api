import { api, createCollection, createUser, TestUser } from "./helpers";

describe("items", () => {
  let owner: TestUser;
  let stranger: TestUser;
  let collectionId: string;

  const itemsPath = () => `/collections/${collectionId}/items`;

  beforeAll(async () => {
    owner = await createUser();
    stranger = await createUser();
    collectionId = (await createCollection(owner)).id;
  });

  it("creates an item with defaults", async () => {
    const response = await api()
      .post(itemsPath())
      .set(owner.auth)
      .send({ title: "Menemen", tags: ["breakfast"] });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: "Menemen",
      priority: "medium",
      tags: ["breakfast"],
      collectionId,
      userId: owner.uid,
    });
  });

  it.each([
    [{ title: "ab" }],
    [{ title: "Menemen", priority: "urgent" }],
    [{ title: "Menemen", url: "not-a-url" }],
  ])("rejects invalid payload %j", async (payload) => {
    const response = await api().post(itemsPath()).set(owner.auth).send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for every item route on another user's collection", async () => {
    const created = await api().post(itemsPath()).set(owner.auth).send({ title: "Private item" });
    const itemId = created.body.id;

    expect((await api().post(itemsPath()).set(stranger.auth).send({ title: "Intruder" })).status).toBe(404);
    expect((await api().get(itemsPath()).set(stranger.auth)).status).toBe(404);
    expect(
      (await api().put(`${itemsPath()}/${itemId}`).set(stranger.auth).send({ title: "Hacked" })).status
    ).toBe(404);
    expect((await api().delete(`${itemsPath()}/${itemId}`).set(stranger.auth)).status).toBe(404);
  });

  it("updates and deletes an item", async () => {
    const created = await api().post(itemsPath()).set(owner.auth).send({ title: "To change" });
    const itemId = created.body.id;

    const updated = await api()
      .put(`${itemsPath()}/${itemId}`)
      .set(owner.auth)
      .send({ priority: "high" });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ title: "To change", priority: "high" });

    expect((await api().delete(`${itemsPath()}/${itemId}`).set(owner.auth)).status).toBe(204);
    expect((await api().delete(`${itemsPath()}/${itemId}`).set(owner.auth)).status).toBe(404);
    expect(
      (await api().put(`${itemsPath()}/${itemId}`).set(owner.auth).send({ title: "Again" })).status
    ).toBe(404);
  });

  it("rejects an empty update body", async () => {
    const created = await api().post(itemsPath()).set(owner.auth).send({ title: "Needs fields" });

    const response = await api().put(`${itemsPath()}/${created.body.id}`).set(owner.auth).send({});

    expect(response.status).toBe(400);
  });

  describe("pagination and filtering", () => {
    let paged: string;

    beforeAll(async () => {
      paged = (await createCollection(owner)).id;
      for (const [title, priority] of [
        ["First item", "low"],
        ["Second item", "high"],
        ["Third item", "high"],
      ]) {
        await api().post(`/collections/${paged}/items`).set(owner.auth).send({ title, priority });
      }
    });

    it("walks through pages with a cursor", async () => {
      const first = await api().get(`/collections/${paged}/items?limit=2`).set(owner.auth);
      expect(first.status).toBe(200);
      expect(first.body.items).toHaveLength(2);
      expect(first.body.nextCursor).toEqual(expect.any(String));

      const second = await api()
        .get(`/collections/${paged}/items?limit=2&cursor=${first.body.nextCursor}`)
        .set(owner.auth);
      expect(second.body.items).toHaveLength(1);
      expect(second.body.nextCursor).toBeNull();

      const ids = [...first.body.items, ...second.body.items].map((i: { id: string }) => i.id);
      expect(new Set(ids).size).toBe(3);
    });

    it("filters by priority", async () => {
      const response = await api().get(`/collections/${paged}/items?priority=high`).set(owner.auth);

      expect(response.body.items).toHaveLength(2);
      expect(response.body.items.every((i: { priority: string }) => i.priority === "high")).toBe(true);
    });

    it.each(["limit=0", "limit=101", "cursor=missing", "priority=urgent"])(
      "rejects invalid query %s",
      async (query) => {
        const response = await api().get(`/collections/${paged}/items?${query}`).set(owner.auth);

        expect(response.status).toBe(400);
      }
    );

    it("includes items in the collection detail", async () => {
      const response = await api().get(`/collections/${paged}`).set(owner.auth);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(3);
    });
  });
});
