import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";
import catchDbError from "../../utility/catchDBError";
import AppError from "../../utility/appError";

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

const signInUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserInDB(req.body);

    const { accessToken, user } = result;

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return sendResponse(res, {
        statusCode: error.statusCode,
        success: false,
        message: error.message,
        errors: error.message,
      });
    }

    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      errors: "Internal server error",
    });
  }
};

export const authController = {
  signUpUser,
  signInUser,
};
