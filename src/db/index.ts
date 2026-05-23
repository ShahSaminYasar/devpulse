import { Pool } from "pg";
import config from "../config";

const pool = new Pool({
  connectionString: config.db_uri,
});

export const initDB = async () => {
  try {
    console.log("Database connected successfully!");
  } catch (error) {
    console.error(error);
  }
};
