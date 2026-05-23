import { pool } from "../../db";
import type { UserPayload } from "../../types";
import bcrypt from "bcryptjs";

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

export const authService = {
  createUserInDB,
};
