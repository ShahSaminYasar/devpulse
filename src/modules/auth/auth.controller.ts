import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";
import catchDbError from "../../utility/catchDBError";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.createUserInDB(req.body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    const { statusCode, message } = catchDbError(error);
    sendResponse(res, {
      statusCode,
      success: false,
      message,
      errors: message,
    });
  }
};

export const authController = {
  signUpUser,
};
