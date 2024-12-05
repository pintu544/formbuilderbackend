import {
  formModel,
  categorizeModel,
  clozeModel,
  comprehensionModel,
  respondentModel,
} from "../models/index.js";

export const getAllResponseByFormId = async (req, res) => {
  try {
    const { formId } = req.params;

    const PAGE_SIZE = parseInt(req.query?.page_size || "10");
    const PAGE_NO = parseInt(req.query?.page_no - 1 || "0");

    let obj = { form: formId };

    const [total, responses] = await Promise.all([
      respondentModel.countDocuments(obj),
      respondentModel
        .find(obj)
        .select("-answers")
        .limit(PAGE_SIZE)
        .skip(PAGE_SIZE * PAGE_NO)
        .sort("-createdAt")
        .lean(),
    ]);

    res.status(200).json({
      data: responses,
      total_data: total,
      total_pages: Math.ceil(total / PAGE_SIZE) || 1,
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};

export const getResponseById = async (req, res) => {
  try {
    const response = await respondentModel
      .findById(req.params.responseId)
      .lean();
    const formId = response?.form;

    const [form, categorize, cloze, comprehension] = await Promise.all([
      formModel.findById(formId).lean(),
      categorizeModel
        .find({ form: formId })
        .select("-form -createdAt -updatedAt")
        .lean(),
      clozeModel
        .find({ form: formId })
        .select("-form -createdAt -updatedAt")
        .lean(),
      comprehensionModel
        .find({ form: formId })
        .select("-form -createdAt -updatedAt")
        .lean(),
    ]);
    const questions = [
      ...(categorize || []),
      ...(cloze || []),
      ...(comprehension || []),
    ];

    res.status(200).json({ data: response, questions: questions, form });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};

export const postResponse = async (req, res) => {
  try {
    const { formId } = req.params;
    let { answers, email } = req.body;
    req.body.form = formId;
    req.body.email = email ? email?.toLowerCase()?.trim() : "";

    let answersObj = answers?.reduce(
      (prev, curr) => ({ ...prev, [curr._id]: curr.answer }),
      {}
    );

    const questions = [
      ...(await categorizeModel
        .find({ form: formId })
        .select("-form -createdAt -updatedAt")
        .lean()),
      ...(await clozeModel
        .find({ form: formId })
        .select("-form -createdAt -updatedAt")
        .lean()),
      ...(await comprehensionModel
        .find({ form: formId })
        .select("-form -createdAt -updatedAt")
        .lean()),
    ];

    req.body.points = questions.reduce((prev, currQuestion, ansIndex) => {
      let points = 0;
      const answer = answersObj[currQuestion._id.toString()];

      if (currQuestion.type === "categorize") {
        const areCorrect = currQuestion.itemsWithBelongsTo.reduce(
          (p, c) => p && answer[c.belongsTo].includes(c.item),
          true
        );

        if (areCorrect) points = currQuestion.points;
      } else if (currQuestion.type === "cloze") {
        const requiredAnswer = currQuestion.sentence
          ?.replace(/<u>/g, "")
          ?.replace(/<\/u>/g, "")
          ?.replace(/\s+/g, "")
          ?.toLowerCase();
        const sentenceArray = currQuestion?.sentenceWithBlanks
          ?.replace(/<u>.*?<\/u>/g, "___________________")
          ?.split("___________________");
        const clientAnswer = sentenceArray
          ?.map((sen, i) => sen + (answer[i] || ""))
          ?.join("")
          ?.replace(/\s+/g, "")
          ?.toLowerCase();

        if (requiredAnswer === clientAnswer) points = currQuestion.points;
      } else if (currQuestion.type === "comprehension") {
        const areCorrect = currQuestion.mcqs.reduce(
          (p, mcq, i) => p && mcq.answer === answer[i],
          true
        );

        if (areCorrect) points = currQuestion.points;
      }

      answers[ansIndex].scored = Number(points);
      return prev + Number(points);
    }, 0);

    await respondentModel.create({ ...req.body });
    res.status(201).json({ message: "Response creation succesfull!" });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};

export const checkEmailAlreadyHasResponse = async (req, res) => {
  try {
    const { formId } = req.params;
    const { email } = req.body;

    const alreadyHasResponse = await respondentModel.findOne({
      email: email?.toLowerCase()?.trim(),
      form: formId,
    });

    if (alreadyHasResponse)
      return res.status(400).json({ message: "Email already has a response." });

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong, Retry!" });
  }
};
