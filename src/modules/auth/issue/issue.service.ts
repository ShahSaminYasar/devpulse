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

export const issueService = {
  createIssueInDB,
  getIssuesFromDB,
  getIssueByIdFromDB,
};
