import { RequestHandler } from "express";

const SERVICE_ID = "ppc-collectify-svc-a1b2c3d4e5f6-us-central1-prod-v2.4.1-rev8a3f";

export const getHealth: RequestHandler = (_req, res) => {
  res.status(200).json({ status: "ok", serviceId: SERVICE_ID });
};
