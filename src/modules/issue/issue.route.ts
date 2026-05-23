import { Router } from "express";
import { issueController } from "./issue.controller";
import { USER_ROLE } from "../../types";
import auth from "../../middleware/auth";

const router = Router();

router.post(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.createIssue,
);
router.get("/", issueController.getIssues);
router.get("/:id", issueController.getIssueById);
router.patch(
  "/:id",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.updateIssue,
);
router.delete("/:id", auth(USER_ROLE.maintainer), issueController.deleteIssue);

export const issueRoute = router;
