import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  port: process.env.PORT,
  db_uri: process.env.DB_URI,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};

export default config;
