import { rateLimit } from "express-rate-limit";
import { AppError } from "../errors/app-error";

export const rateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
  handler: (_req, _res, next) => {
    next(new AppError(429, "TOO_MANY_REQUESTS", "Too many requests, please try again later"));
  },
});
