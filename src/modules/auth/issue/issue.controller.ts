import type { Request, Response } from "express";
import sendResponse from "../../../utility/sendResponse";
import AppError from "../../../utility/appError";
import { issueService } from "./issue.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.createIssueInDB({
      ...req.body,
      userId: req.user?.id,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
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

export const issueController = {
  createIssue,
};
