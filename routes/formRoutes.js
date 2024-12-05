import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import {
  getAllForms,
  getFormById,
  getFormQuestionsById,
  postForm,
  editFormById,
  deleteFormById,
} from "../controllers/formController.js";

const router = Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (_, file) => {
    const ogFileName = file.originalname;
    return {
      folder: "forms",
      public_id: ogFileName.split(".").shift(),
    };
  },
});

const upload = multer({ storage });

router
  .route("/")
  .get(getAllForms)
  .post(
    upload.fields([
      { name: "headerImage", maxCount: 1 },
      { name: "questionsImages" },
    ]),
    postForm
  );

router
  .route("/:formId")
  .get(getFormById)
  .patch(
    upload.fields([
      { name: "headerImage", maxCount: 1 },
      { name: "questionsImages" },
    ]),
    editFormById
  )
  .delete(deleteFormById);

router.route("/client/:formId").get(getFormQuestionsById);

export default router;
