import { RequestHandler } from "express";
import { ZodType } from "zod";
import { AppError } from "../errors/app-error";

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw AppError.validation(result.error.issues);
    }

    req.body = result.data;
    next();
  };
