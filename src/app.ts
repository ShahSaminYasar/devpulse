import express, {
  type Application,
  type Request,
  type Response,
} from "express";

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

export default app;
