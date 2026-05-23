export type UserPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type Roles = "contributor" | "maintainer";

export type IssuePayload = {
  title: string;
  description: string;
  type: string;
  userId: number;
};

export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;
