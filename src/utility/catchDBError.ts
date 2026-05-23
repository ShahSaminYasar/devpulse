interface PostgresError {
  code: string;
  constraint?: string;
}

const isPostgresError = (error: unknown): error is PostgresError => {
  return typeof error === "object" && error !== null && "code" in error;
};

const catchDbError = (
  error: unknown,
): { statusCode: number; message: string } => {
  if (isPostgresError(error)) {
    switch (error.code) {
      case "23505":
        return { statusCode: 409, message: "Email already exists" };
      case "23502":
        return { statusCode: 400, message: "All fields are required" };
      case "23514":
        return {
          statusCode: 400,
          message: "Invalid role. Must be contributor or maintainer",
        };
      default:
        return { statusCode: 500, message: "Database error" };
    }
  }

  return { statusCode: 500, message: "Internal server error" };
};

export default catchDbError;
