import { randomUUID } from "node:crypto";
import request from "supertest";
import { app } from "../../src/app";

export const api = () => request(app);

export interface TestUser {
  uid: string;
  token: string;
  auth: { Authorization: string };
}

export const createUser = async (): Promise<TestUser> => {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const response = await fetch(
    `http://${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `${randomUUID()}@example.com`,
        password: "test1234",
        returnSecureToken: true,
      }),
    }
  );
  const body = (await response.json()) as { idToken: string; localId: string };
  return {
    uid: body.localId,
    token: body.idToken,
    auth: { Authorization: `Bearer ${body.idToken}` },
  };
};

export const createCollection = async (user: TestUser, name = `Collection ${randomUUID()}`) => {
  const response = await api().post("/collections").set(user.auth).send({ name });
  return response.body as { id: string; name: string };
};
