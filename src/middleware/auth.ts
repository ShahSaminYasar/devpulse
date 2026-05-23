import type { NextFunction, Request, Response } from "express";
import type { Roles } from "../types";
import sendResponse from "../utility/sendResponse";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = (...roles: Roles[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token)
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized",
          errors: {},
        });

      const decoded = jwt.verify(
        token as string,
        config.access_token_secret as string,
      ) as JwtPayload;

      const userData = await pool.query(
        `
            SELECT * FROM users WHERE email=$1
        `,
        [decoded.email],
      );

      if (userData.rows.length === 0)
        return sendResponse(res, {
          statusCode: 404,
          success: false,
          message: "User not found",
          errors: {},
        });

      const user = userData.rows[0];

      if (roles.length && !roles.includes(user.role))
        return sendResponse(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden",
          errors: {},
        });

      req.user = user;

      next();
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
};

export default auth;
