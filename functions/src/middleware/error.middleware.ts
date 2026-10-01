import { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "firebase-functions";
import { AppError } from "../errors/app-error";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(AppError.notFound("Route not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
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
