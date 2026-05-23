import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/auth/issue/issue.route";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
// TODO: CORS

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse server",
    author: "Shah Samin Yasar",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);

export default app;
