import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../../middleware/auth";
import { USER_ROLE } from "../../../types";

const router = Router();

router.post(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.createIssue,
);
router.get("/", issueController.getIssues);

export const issueRoute = router;
