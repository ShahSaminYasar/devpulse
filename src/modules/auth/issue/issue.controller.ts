import type { Request, Response } from "express";
import sendResponse from "../../../utility/sendResponse";
import AppError from "../../../utility/appError";
import { issueService } from "./issue.service";
import { pool } from "../../../db";

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

const getIssues = async (req: Request, res: Response) => {
  try {
    const {
      sort = "newest",
      type,
      status,
    } = req.query as {
      sort?: string;
      type?: string;
      status?: string;
    };

    const result = await issueService.getIssuesFromDB(sort, type, status);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result,
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

const getIssueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issueService.getIssueByIdFromDB(Number(id));

    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        errors: "Issue not found",
      });
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result,
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
  getIssues,
  getIssueById,
};
