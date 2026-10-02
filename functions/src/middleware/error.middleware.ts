import { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "firebase-functions";
import { AppError } from "../errors/app-error";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(AppError.notFound("Route not found"));
};

interface BodyParserError {
  type: string;
  status: number;
}

const BODY_PARSER_FAILURES: Record<string, { code: string; message: string }> = {
  "entity.parse.failed": { code: "INVALID_JSON", message: "Request body is not valid JSON" },
  "entity.too.large": { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" },
};

const isBodyParserError = (err: unknown): err is BodyParserError =>
  typeof err === "object" &&
  err !== null &&
  "type" in err &&
  typeof err.type === "string" &&
  "status" in err &&
  typeof err.status === "number" &&
  err.status >= 400 &&
  err.status < 500;

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (isBodyParserError(err)) {
    const failure = BODY_PARSER_FAILURES[err.type] ?? {
      code: "BAD_REQUEST",
      message: "Request body could not be processed",
    };
    res.status(err.status).json({ error: { ...failure, details: null } });
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
