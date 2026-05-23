import { pool } from "../../../db";
import type { IssuePayload } from "../../../types";

const createIssueInDB = async (payload: IssuePayload) => {
  const { title, description, type, userId } = payload;

  const result = await pool.query(
    `
            INSERT INTO issues(title, description, type, reporter_id)
                VALUES($1, $2, $3, $4)
                    RETURNING *
        `,
    [title, description, type, userId],
  );

  return result;
};

export const issueService = {
  createIssueInDB,
};
