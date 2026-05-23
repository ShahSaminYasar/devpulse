
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  db_uri: process.env.DB_URI,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.db_uri
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor'
            CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL
            CHECK (char_length(description) >= 20),
        type VARCHAR(20) NOT NULL
            CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(20) NOT NULL DEFAULT 'open'
            CHECK (status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        ) 
    `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.error(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// src/utility/appError.ts
var AppError = class extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.name = "AppError";
  }
  message;
  statusCode;
};
var appError_default = AppError;

// src/modules/auth/auth.service.ts
var createUserInDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
        INSERT INTO users(name, email, password, role) 
            VALUES($1, $2, $3, $4) 
            RETURNING *
        `,
    [name, email, hashedPassword, role]
  );
  const { password: userPassword, ...userWithoutPassword } = result.rows[0];
  return userWithoutPassword;
};
var loginUserInDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1    
    `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new appError_default("Invalid credentials", 401);
  }
  const user = userData.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new appError_default("Invalid credentials", 401);
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const accessToken = jwt.sign(
    jwtPayload,
    config_default.access_token_secret,
    {
      expiresIn: "1d"
    }
  );
  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  createUserInDB,
  loginUserInDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  if (data.success) {
    res.status(data.statusCode).json({
      success: data.success,
      message: data.message,
      data: data.data
    });
  } else {
    res.status(data.statusCode).json({
      success: data.success,
      message: data.message,
      errors: data.errors
    });
  }
};
var sendResponse_default = sendResponse;

// src/utility/catchDBError.ts
var isPostgresError = (error) => {
  return typeof error === "object" && error !== null && "code" in error;
};
var catchDbError = (error) => {
  if (isPostgresError(error)) {
    switch (error.code) {
      case "23505":
        return { statusCode: 409, message: "Email already exists" };
      case "23502":
        return { statusCode: 400, message: "All fields are required" };
      case "23514":
        return {
          statusCode: 400,
          message: "Invalid role. Must be contributor or maintainer"
        };
      default:
        return { statusCode: 500, message: "Database error" };
    }
  }
  return { statusCode: 500, message: "Internal server error" };
};
var catchDBError_default = catchDbError;

// src/modules/auth/auth.controller.ts
var signUpUser = async (req, res) => {
  try {
    const result = await authService.createUserInDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    const { statusCode, message } = catchDBError_default(error);
    sendResponse_default(res, {
      statusCode,
      success: false,
      message,
      errors: message
    });
  }
};
var signInUser = async (req, res) => {
  try {
    const result = await authService.loginUserInDB(req.body);
    const { accessToken, user } = result;
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user
      }
    });
  } catch (error) {
    if (error instanceof appError_default) {
      return sendResponse_default(res, {
        statusCode: error.statusCode,
        success: false,
        message: error.message,
        errors: error.message
      });
    }
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      errors: "Internal server error"
    });
  }
};
var authController = {
  signUpUser,
  signInUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signUpUser);
router.post("/login", authController.signInUser);
var authRoute = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issue/issue.service.ts
var createIssueInDB = async (payload) => {
  const { title, description, type, userId } = payload;
  const result = await pool.query(
    `
            INSERT INTO issues(title, description, type, reporter_id)
                VALUES($1, $2, $3, $4)
                    RETURNING *
        `,
    [title, description, type, userId]
  );
  return result;
};
var getIssuesFromDB = async (sort, type, status) => {
  const conditions = [];
  const values = [];
  if (type) {
    values.push(type);
    conditions.push(`type=$${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status=$${values.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions?.join(" AND ")}` : "";
  const orderClause = sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";
  const result = await pool.query(
    `
        SELECT * FROM issues ${whereClause} ${orderClause}
        `,
    values
  );
  if (result.rows.length === 0) return [];
  const reporterIds = [
    ...new Set(result.rows.map((issue) => issue.reporter_id))
  ];
  const reportersData = await pool.query(
    `
        SELECT id, name, role FROM users WHERE id=ANY($1)
        `,
    [reporterIds]
  );
  const finalData = [];
  result.rows.forEach((issue) => {
    const reporter = reportersData.rows.find((r) => r.id === issue.reporter_id);
    issue.reporter = reporter ? { id: reporter.id, name: reporter.name, role: reporter.role } : null;
    const { reporter_id, ...issueData } = issue;
    finalData.push(issueData);
  });
  return finalData;
};
var getIssueByIdFromDB = async (id) => {
  const result = await pool.query(
    `
        SELECT * FROM issues WHERE id=$1    
    `,
    [id]
  );
  if (result.rows.length === 0) return null;
  const issue = result.rows[0];
  const reporterData = await pool.query(
    `SELECT id, name, role FROM users WHERE id=$1`,
    [issue.reporter_id]
  );
  const reporter = reporterData.rows[0];
  issue.reporter = reporter ? { id: reporter.id, name: reporter.name, role: reporter.role } : null;
  const { reporter_id, ...issueWithoutReporterId } = issue;
  return issueWithoutReporterId;
};
var updateIssueInDB = async (payload, issueId, userId, userRole) => {
  const { title, description, type } = payload;
  const targetIssue = await pool.query(`SELECT * FROM issues WHERE id=$1`, [
    issueId
  ]);
  if (targetIssue.rows.length === 0) throw new appError_default("Issue not found", 404);
  if (userRole !== "maintainer") {
    if (targetIssue.rows[0].reporter_id !== userId) {
      throw new appError_default("Forbidden", 403);
    } else {
      if (targetIssue.rows[0].status !== "open") {
        throw new appError_default("Only open issues can be updated", 409);
      }
    }
  }
  const result = await pool.query(
    `
    UPDATE issues
    SET
    title=COALESCE($1, title),
    description=COALESCE($2, description),
    type=COALESCE($3, type),
    updated_at=NOW()
    WHERE id=$4
    RETURNING *
    `,
    [title, description, type, issueId]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (issueId) => {
  const targetIssue = await pool.query(`SELECT * FROM issues WHERE id=$1`, [
    issueId
  ]);
  if (targetIssue.rows.length === 0) throw new appError_default("Issue not found", 404);
  await pool.query(`DELETE FROM issues WHERE id=$1`, [issueId]);
  return;
};
var issueService = {
  createIssueInDB,
  getIssuesFromDB,
  getIssueByIdFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const result = await issueService.createIssueInDB({
      ...req.body,
      userId: req.user?.id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    if (error instanceof appError_default) {
      return sendResponse_default(res, {
        statusCode: error.statusCode,
        success: false,
        message: error.message,
        errors: error.message
      });
    }
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      errors: "Internal server error"
    });
  }
};
var getIssues = async (req, res) => {
  try {
    const {
      sort = "newest",
      type,
      status
    } = req.query;
    const result = await issueService.getIssuesFromDB(sort, type, status);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    if (error instanceof appError_default) {
      return sendResponse_default(res, {
        statusCode: error.statusCode,
        success: false,
        message: error.message,
        errors: error.message
      });
    }
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      errors: "Internal server error"
    });
  }
};
var getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.getIssueByIdFromDB(Number(id));
    if (!result) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        errors: "Issue not found"
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    if (error instanceof appError_default) {
      return sendResponse_default(res, {
        statusCode: error.statusCode,
        success: false,
        message: error.message,
        errors: error.message
      });
    }
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      errors: "Internal server error"
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const result = await issueService.updateIssueInDB(
      payload,
      Number(id),
      req.user?.id,
      req.user?.role
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    if (error instanceof appError_default) {
      return sendResponse_default(res, {
        statusCode: error.statusCode,
        success: false,
        message: error.message,
        errors: error.message
      });
    }
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      errors: "Internal server error"
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    await issueService.deleteIssueFromDB(Number(req.params.id));
    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    if (error instanceof appError_default) {
      return sendResponse_default(res, {
        statusCode: error.statusCode,
        success: false,
        message: error.message,
        errors: error.message
      });
    }
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error",
      errors: "Internal server error"
    });
  }
};
var issueController = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  deleteIssue
};

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token)
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized",
          errors: {}
        });
      const decoded = jwt2.verify(
        token,
        config_default.access_token_secret
      );
      const userData = await pool.query(
        `
            SELECT * FROM users WHERE email=$1
        `,
        [decoded.email]
      );
      if (userData.rows.length === 0)
        return sendResponse_default(res, {
          statusCode: 404,
          success: false,
          message: "User not found",
          errors: {}
        });
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role))
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden",
          errors: {}
        });
      req.user = user;
      next();
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.createIssue
);
router2.get("/", issueController.getIssues);
router2.get("/:id", issueController.getIssueById);
router2.patch(
  "/:id",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.updateIssue
);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), issueController.deleteIssue);
var issueRoute = router2;

// src/app.ts
import cors from "cors";

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.message || "Internal server error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DevPulse server",
    author: "Shah Samin Yasar"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`DevPulse server is listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map