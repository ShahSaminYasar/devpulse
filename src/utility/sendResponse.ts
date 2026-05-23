import type { Response } from "express";

type TSuccessResponse<T> = {
  statusCode: number;
  success: true;
  message: string;
  data: T;
};

type TErrorResponse = {
  statusCode: number;
  success: false;
  message: string;
  errors: unknown;
};

type TResponse<T> = TSuccessResponse<T> | TErrorResponse;

const sendResponse = <T>(res: Response, data: TResponse<T>): void => {
  if (data.success) {
    res.status(data.statusCode).json({
      success: data.success,
      message: data.message,
      data: data.data,
    });
  } else {
    res.status(data.statusCode).json({
      success: data.success,
      message: data.message,
      errors: data.errors,
    });
  }
};

export default sendResponse;
