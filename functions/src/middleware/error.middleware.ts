import { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "firebase-functions";
import { AppError } from "../errors/app-error";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(AppError.notFound("Route not found"));
};

interface MalformedJsonError {
  type: "entity.parse.failed";
  status?: number;
}

const isMalformedJson = (err: unknown): err is MalformedJsonError =>
  typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isMalformedJson(err)) {
    res.status(400).json({
      error: { code: "INVALID_JSON", message: "Request body is not valid JSON", details: null },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Internal server error", details: null },
  });
};
