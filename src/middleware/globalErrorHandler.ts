import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      errors: "Token expired",
    });
  }

  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      errors: "Invalid token",
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.message || "Internal server error",
  });
};

export default globalErrorHandler;
