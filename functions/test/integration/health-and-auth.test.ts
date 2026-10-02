import { api, createUser } from "./helpers";

describe("health and authentication", () => {
  it("returns the exact health payload without a token", async () => {
    const response = await api().get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      serviceId: "ppc-collectify-svc-a1b2c3d4e5f6-us-central1-prod-v2.4.1-rev8a3f",
    });
  });

  it("rejects requests without a token using the error envelope", async () => {
    const response = await api().get("/collections");

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      code: "UNAUTHORIZED",
      message: expect.any(String),
      details: null,
    });
  });

  it("rejects an invalid token", async () => {
    const response = await api().get("/collections").set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
  });

  it("returns 401 for unknown routes without a token", async () => {
    const response = await api().get("/unknown");

    expect(response.status).toBe(401);
  });

  it("returns 404 with the error envelope for unknown routes with a token", async () => {
    const user = await createUser();

    const response = await api().get("/unknown").set(user.auth);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const user = await createUser();

    const response = await api()
      .post("/collections")
      .set(user.auth)
      .set("Content-Type", "application/json")
      .send("{bad json");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  it("returns 413 for oversized bodies", async () => {
    const user = await createUser();

    const response = await api()
      .post("/collections")
      .set(user.auth)
      .send({ name: "Huge", description: "a".repeat(200_000) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it.each(["/collections/__reserved__", "/collections/valid/items/__reserved__", "/collections/__reserved__/items"])(
    "returns 404 instead of 500 for reserved ids on %s",
    async (path) => {
      const user = await createUser();

      const response = await api().get(path).set(user.auth);

      expect(response.status).toBe(404);
    }
  );
});
