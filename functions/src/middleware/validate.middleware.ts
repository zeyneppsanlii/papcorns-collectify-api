import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ZodType } from "zod";
import { AppError } from "../errors/app-error";

export const validateBody =
  <P = ParamsDictionary>(schema: ZodType): RequestHandler<P> =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw AppError.validation(result.error.issues);
    }

    req.body = result.data;
    next();
  };

export const validateQuery =
  <P = ParamsDictionary>(schema: ZodType): RequestHandler<P> =>
  (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      throw AppError.validation(result.error.issues);
    }

    res.locals.query = result.data;
    next();
  };
