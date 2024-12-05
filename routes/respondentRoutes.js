import { Router } from "express";

import {
  getAllResponseByFormId,
  getResponseById,
  postResponse,
  checkEmailAlreadyHasResponse,
} from "../controllers/respondentController.js";

const router = Router();

router.route("/:formId").get(getAllResponseByFormId).post(postResponse);

router
  .route("/:formId/check-valid-response")
  .post(checkEmailAlreadyHasResponse);

router.route("/response/:responseId").get(getResponseById);

export default router;
