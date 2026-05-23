import config from "../../config";
import { pool } from "../../db";
import type { UserPayload } from "../../types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../../utility/appError";

const createUserInDB = async (payload: UserPayload) => {
  const { name, email, password, role } = payload;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
        INSERT INTO users(name, email, password, role) 
            VALUES($1, $2, $3, $4) 
            RETURNING *
        `,
    [name, email, hashedPassword, role],
  );

  delete result.rows[0].password;

  return result.rows[0];
};

const loginUserInDB = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1    
    `,
    [email],
  );

  if (userData.rows.length === 0) {
    throw new AppError("Invalid credentials", 401);
  }

  const user = userData.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const accessToken = jwt.sign(
    jwtPayload,
    config.access_token_secret as string,
    {
      expiresIn: "1d",
    },
  );

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

export const authService = {
  createUserInDB,
  loginUserInDB,
};
