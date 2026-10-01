import { RequestHandler } from "express";
import { auth } from "../config/firebase";
import { AppError } from "../errors/app-error";

const BEARER_PREFIX = "Bearer ";

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith(BEARER_PREFIX)) {
    throw AppError.unauthorized("Missing or malformed Authorization header");
  }

  try {
    const decoded = await auth.verifyIdToken(header.slice(BEARER_PREFIX.length));
    req.userId = decoded.uid;
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }

  next();
};
