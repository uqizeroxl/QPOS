import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "./errorHandler";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const messages = result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      );
      throw new AppError(400, messages.join("; "));
    }
    req[source] = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return validate(schema, "params");
}

export function validateQuery(schema: ZodSchema) {
  return validate(schema, "query");
}