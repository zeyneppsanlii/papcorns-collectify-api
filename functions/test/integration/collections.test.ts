import { api, createCollection, createUser, TestUser } from "./helpers";

describe("collections", () => {
  let owner: TestUser;
  let stranger: TestUser;

  beforeAll(async () => {
    owner = await createUser();
    stranger = await createUser();
  });

  it("creates a collection scoped to the authenticated user", async () => {
    const response = await api()
      .post("/collections")
      .set(owner.auth)
      .send({ name: "Recipes", description: "food" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: "Recipes",
      description: "food",
      userId: owner.uid,
    });
    expect(response.body.createdAt).toEqual(expect.any(String));
  });

  it("rejects invalid payloads with validation details", async () => {
    const response = await api().post("/collections").set(owner.auth).send({ name: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toEqual(expect.any(Array));
  });

  it("returns 409 for duplicate names regardless of case", async () => {
    const response = await api().post("/collections").set(owner.auth).send({ name: "recipes" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
  });

  it("allows the same name for different users", async () => {
    const response = await api().post("/collections").set(stranger.auth).send({ name: "Recipes" });

    expect(response.status).toBe(201);
  });

  it("lists only the caller's collections", async () => {
    const response = await api().get("/collections").set(stranger.auth);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].userId).toBe(stranger.uid);
  });

  it("returns 404 when another user reads, updates or deletes a collection", async () => {
    const { id } = await createCollection(owner);

    expect((await api().get(`/collections/${id}`).set(stranger.auth)).status).toBe(404);
    expect(
      (await api().put(`/collections/${id}`).set(stranger.auth).send({ name: "Hacked" })).status
    ).toBe(404);
    expect((await api().delete(`/collections/${id}`).set(stranger.auth)).status).toBe(404);
  });

  it("updates a collection and rejects renaming to an existing name", async () => {
    const first = await createCollection(owner, "Update source");
    const second = await createCollection(owner, "Update target");

    const renamed = await api()
      .put(`/collections/${first.id}`)
      .set(owner.auth)
      .send({ name: "Renamed" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.name).toBe("Renamed");

    const conflict = await api()
      .put(`/collections/${second.id}`)
      .set(owner.auth)
      .send({ name: "renamed" });
    expect(conflict.status).toBe(409);
  });

  it("keeps the same name when updating only the description", async () => {
    const { id } = await createCollection(owner, "Description only");

    const response = await api()
      .put(`/collections/${id}`)
      .set(owner.auth)
      .send({ description: "updated" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Description only");
  });

  it("deletes a collection together with its items", async () => {
    const { id } = await createCollection(owner);
    await api().post(`/collections/${id}/items`).set(owner.auth).send({ title: "Gone soon" });

    expect((await api().delete(`/collections/${id}`).set(owner.auth)).status).toBe(204);
    expect((await api().get(`/collections/${id}`).set(owner.auth)).status).toBe(404);
  });

  it("enforces the 20 collection limit per user", async () => {
    const limited = await createUser();

    for (let i = 1; i <= 20; i += 1) {
      const response = await api().post("/collections").set(limited.auth).send({ name: `C${i}` });
      expect(response.status).toBe(201);
    }

    const overflow = await api().post("/collections").set(limited.auth).send({ name: "C21" });
    expect(overflow.status).toBe(422);
    expect(overflow.body.error.code).toBe("LIMIT_EXCEEDED");
  });

  it("enforces uniqueness and the limit under concurrent creation", async () => {
    const racer = await createUser();

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        api().post("/collections").set(racer.auth).send({ name: "Same name" })
      )
    );

    const created = responses.filter((r) => r.status === 201);
    expect(created).toHaveLength(1);
    expect(responses.filter((r) => r.status === 409)).toHaveLength(4);
  });
});
