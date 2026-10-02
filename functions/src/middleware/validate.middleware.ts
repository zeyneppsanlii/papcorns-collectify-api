import { RequestHandler, RequestParamHandler } from "express";
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

const DOCUMENT_ID_PATTERN = /^(?!__.*__$)(?!\.{1,2}$)[^/]+$/;
const MAX_DOCUMENT_ID_LENGTH = 1500;

export const validateDocumentId: RequestParamHandler = (_req, _res, next, value) => {
  const valid =
    typeof value === "string" &&
    value.length <= MAX_DOCUMENT_ID_LENGTH &&
    DOCUMENT_ID_PATTERN.test(value);

  if (!valid) {
    throw AppError.notFound();
  }
  next();
};
