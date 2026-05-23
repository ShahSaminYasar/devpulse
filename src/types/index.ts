export type UserPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type Roles = "contributor" | "maintainer";
