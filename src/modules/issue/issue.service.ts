import { pool } from "../../db";
import type { IssuePayload } from "../../types";
import AppError from "../../utility/appError";

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

const getIssuesFromDB = async (
  sort: string,
  type: string | null | undefined,
  status: string | null | undefined,
) => {
  const conditions: string[] = [];
  const values: string[] = [];

  if (type) {
    values.push(type);
    conditions.push(`type=$${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`status=$${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions?.join(" AND ")}`
    : "";

  const orderClause =
    sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";

  const result = await pool.query(
    `
        SELECT * FROM issues ${whereClause} ${orderClause}
        `,
    values,
  );

  if (result.rows.length === 0) return [];

  const reporterIds = [
    ...new Set(result.rows.map((issue) => issue.reporter_id)),
  ];

  const reportersData = await pool.query(
    `
        SELECT id, name, role FROM users WHERE id=ANY($1)
        `,
    [reporterIds],
  );

  const finalData: {
    id: number;
    title: string;
    description: string;
    type: string;
    status: string;
    reporter: {
      id: number;
      name: string;
      role: string;
    };
    created_at: Date;
    updated_at: Date;
  }[] = [];

  result.rows.forEach((issue) => {
    const reporter = reportersData.rows.find((r) => r.id === issue.reporter_id);
    issue.reporter = reporter
      ? { id: reporter.id, name: reporter.name, role: reporter.role }
      : null;
    const { reporter_id, ...issueData } = issue;
    finalData.push(issueData);
  });

  return finalData;
};

const getIssueByIdFromDB = async (id: number) => {
  const result = await pool.query(
    `
        SELECT * FROM issues WHERE id=$1    
    `,
    [id],
  );

  if (result.rows.length === 0) return null;

  const issue = result.rows[0];

  const reporterData = await pool.query(
    `SELECT id, name, role FROM users WHERE id=$1`,
    [issue.reporter_id],
  );

  const reporter = reporterData.rows[0];

  issue.reporter = reporter
    ? { id: reporter.id, name: reporter.name, role: reporter.role }
    : null;

  const { reporter_id, ...issueWithoutReporterId } = issue;

  return issueWithoutReporterId;
};

const updateIssueInDB = async (
  payload: IssuePayload,
  issueId: number,
  userId: number,
  userRole: string,
) => {
  const { title, description, type } = payload;

  const targetIssue = await pool.query(`SELECT * FROM issues WHERE id=$1`, [
    issueId,
  ]);

  if (targetIssue.rows.length === 0) throw new AppError("Issue not found", 404);

  if (userRole !== "maintainer") {
    if (targetIssue.rows[0].reporter_id !== userId) {
      throw new AppError("Forbidden", 403);
    } else {
      if (targetIssue.rows[0].status !== "open") {
        throw new AppError("Only open issues can be updated", 409);
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
    [title, description, type, issueId],
  );

  return result.rows[0];
};

const deleteIssueFromDB = async (issueId: number) => {
  const targetIssue = await pool.query(`SELECT * FROM issues WHERE id=$1`, [
    issueId,
  ]);

  if (targetIssue.rows.length === 0) throw new AppError("Issue not found", 404);

  await pool.query(`DELETE FROM issues WHERE id=$1`, [issueId]);

  return;
};

export const issueService = {
  createIssueInDB,
  getIssuesFromDB,
  getIssueByIdFromDB,
  updateIssueInDB,
  deleteIssueFromDB,
};
