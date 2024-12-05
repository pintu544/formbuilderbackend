import { v2 as cloudinary } from "cloudinary";

import {
  formModel,
  categorizeModel,
  clozeModel,
  comprehensionModel,
} from "../models/index.js";

import { getPublicIdFromUrl } from "../utils/cloudinary.js";

export const getAllForms = async (req, res) => {
  try {
    const PAGE_SIZE = parseInt(req.query?.page_size || "10");
    const PAGE_NO = parseInt(req.query?.page_no - 1 || "0");

    let obj = {};

    const [total, forms] = await Promise.all([
      formModel.countDocuments(obj),
      formModel
        .find(obj)
        .limit(PAGE_SIZE)
        .skip(PAGE_SIZE * PAGE_NO)
        .sort("-createdAt")
        .lean(),
    ]);

    res.status(200).json({
      data: forms,
      total_data: total,
      total_pages: Math.ceil(total / PAGE_SIZE) || 1,
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};

export const getFormById = async (req, res) => {
  try {
    const formId = req.params.formId;

    const [formData, categorizeQues, clozeQues, comprehensionQues] =
      await Promise.all([
        formModel.findById(formId).lean(),
        categorizeModel.find({ form: formId }).lean(),
        clozeModel.find({ form: formId }).lean(),
        comprehensionModel.find({ form: formId }).lean(),
      ]);

    res.status(200).json({
      data: {
        ...formData,
        questions: [...categorizeQues, ...clozeQues, ...comprehensionQues],
      },
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};

export const getFormQuestionsById = async (req, res) => {
  try {
    const formId = req.params.formId;

    const [formData, categorizeQues, clozeQues, comprehensionQues] =
      await Promise.all([
        formModel.findById(formId).select("-createdAt -updatedAt").lean(),
        categorizeModel
          .find({ form: formId })
          .select("-form -itemsWithBelongsTo.belongsTo -createdAt -updatedAt")
          .lean(),
        clozeModel
          .find({ form: formId })
          .select("-form -sentence -createdAt -updatedAt")
          .lean(),
        comprehensionModel
          .find({ form: formId })
          .select("-form -mcqs.answer -createdAt -updatedAt")
          .lean(),
      ]);

    res.status(200).json({
      data: {
        ...formData,
        questions: [...categorizeQues, ...clozeQues, ...comprehensionQues],
      },
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};

export const postForm = async (req, res) => {
  try {
    const formId = req.body.formId;

    req.body.headerImage = req.files?.headerImage?.shift()?.path || "";

    const questionsImagesObj =
      req.files?.questionsImages?.reduce((prev, curr) => {
        const id = curr.filename.replace(`forms/${formId}-`, "");
        return { ...prev, [id]: curr.path };
      }, {}) || {};

    const newForm = await formModel.create({ ...req.body });

    if (req.body.questions) {
      const questions = JSON.parse(req.body.questions);
      await Promise.all([
        ...questions.map(async (question, index) => {
          const questionObj = {
            ...question,
            form: newForm.id,
            imageUrl: questionsImagesObj[index.toString()] || "",
          };

          return question.type === "categorize"
            ? await categorizeModel.create(questionObj)
            : question.type === "cloze"
            ? await clozeModel.create(questionObj)
            : await comprehensionModel.create(questionObj);
        }),
      ]);
    }

    res.status(200).json({ message: "Form creation successful!" });
  } catch (error) {
    console.error("error", error);
    if (req.files.headerImage)
      await cloudinary.uploader.destroy(req.files.headerImage[0].path);
    if (req.files.questionsImages)
      req.files.questionsImages.map(
        async (img) => await cloudinary.uploader.destroy(img.path)
      );
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};

export const editFormById = async (req, res) => {
  try {
    const { formId } = req.params;

    let formData = {
      formName: req.body.formName,
    };

    if (req.files?.headerImage?.shift()?.path)
      formData.headerImage = req.files?.headerImage?.shift()?.path;

    const questionsImagesObj =
      req.files?.questionsImages?.reduce((prev, curr) => {
        const id = curr.filename.replace(`forms/${formId}-`, "");
        return { ...prev, [id]: curr.path };
      }, {}) || {};

    const updatedForm = await formModel.findByIdAndUpdate(formId, formData);
    if (formData?.headerImage && updatedForm.headerImage)
      await cloudinary.uploader.destroy(
        getPublicIdFromUrl(updatedForm.headerImage)
      );

    if (req.body.deletedQuestions) {
      const deletedQuestions = JSON.parse(req.body.deletedQuestions);

      await Promise.all([
        ...deletedQuestions.map(async (question) => {
          const deletedQuestion =
            question.type === "categorize"
              ? await categorizeModel.findByIdAndDelete(question._id)
              : question.type === "cloze"
              ? await clozeModel.findByIdAndDelete(question._id)
              : question.type === "comprehension"
              ? await comprehensionModel.findByIdAndDelete(question._id)
              : null;

          if (deletedQuestion?.imageUrl)
            await cloudinary.uploader.destroy(
              getPublicIdFromUrl(deletedQuestions.imageUrl)
            );

          return;
        }),
      ]);
    }

    if (req.body.questions) {
      const questions = JSON.parse(req.body.questions);
      await Promise.all([
        ...questions.map(async (question, index) => {
          const questionId = question?._id;
          let questionObj = {
            ...question,
            form: formId,
          };
          const imageUrl = questionsImagesObj[index.toString()] || "";
          if (imageUrl) questionObj.imageUrl = imageUrl;

          if (questionId) {
            const updatedQuestion =
              question.type === "categorize"
                ? await categorizeModel.findByIdAndUpdate(
                    questionId,
                    questionObj
                  )
                : question.type === "cloze"
                ? await clozeModel.findByIdAndUpdate(questionId, questionObj)
                : question.type === "comprehension"
                ? await comprehensionModel.findByIdAndUpdate(
                    questionId,
                    questionObj
                  )
                : null;

            if (
              (imageUrl && updatedQuestion?.imageUrl) ||
              (!question.imageUrl && updatedQuestion.imageUrl)
            )
              await cloudinary.uploader.destroy(
                getPublicIdFromUrl(updatedQuestion.imageUrl)
              );
            return;
          } else {
            return question.type === "categorize"
              ? await categorizeModel.create(questionObj)
              : question.type === "cloze"
              ? await clozeModel.create(questionObj)
              : question.type === "comprehension"
              ? await comprehensionModel.create(questionObj)
              : null;
          }
        }),
      ]);
    }

    res.status(200).json({ message: "Form updation successful!" });
  } catch (error) {
    console.error("error", error);
    if (req.files.headerImage)
      await cloudinary.uploader.destroy(req.files.headerImage[0].path);
    if (req.files.questionsImages)
      req.files.questionsImages.map(
        async (img) => await cloudinary.uploader.destroy(img.path)
      );
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};

export const deleteFormById = async (req, res) => {
  try {
    const { formId } = req.params;

    const deletedForm = await formModel.findByIdAndDelete(formId);
    if (deletedForm.headerImage)
      await cloudinary.uploader.destroy(
        getPublicIdFromUrl(deletedForm.headerImage)
      );

    const [categorizeQues, clozeQues, comprehensionQues] = await Promise.all([
      categorizeModel.find({ form: formId }),
      clozeModel.find({ form: formId }),
      comprehensionModel.find({ form: formId }),
    ]);

    const questions = [...categorizeQues, ...clozeQues, ...comprehensionQues];
    await Promise.all([
      ...questions.map(async (question) => {
        if (question.imageUrl)
          await cloudinary.uploader.destroy(
            getPublicIdFromUrl(question.imageUrl)
          );

        return await question.deleteOne();
      }),
    ]);

    res.status(200).json({ message: "Form deletion successful!" });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};
