import asyncWrapper from "@utils/asyncWrapper";
import { successWithBaseResponse } from "@utils/response";
import express from "express";

const router = express.Router();

router.get(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const subjects = await pb.collection("notes_subjects").getFullList({
      filter: `workspace = "${req.params.id}"`,
    });

    successWithBaseResponse(res, subjects);
  }),
);

router.post(
  "/",
  asyncWrapper(async (req, res) => {
    const { pb } = req;

    const { title } = req.body;
    const existing = await pb.collection("notes_subjects").getFullList({
      filter: `title = "${title}" && workspace = "${req.body.workspace}"`,
    });
    if (existing.length > 0) {
      res.status(400).json({
        state: "error",
        message: "Subject already exists",
      });

      return;
    }
    const subject = await pb.collection("notes_subjects").create(req.body);

    successWithBaseResponse(res, subject);
  }),
);

router.patch(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const subject = await pb
      .collection("notes_subjects")
      .update(req.params.id, req.body);

    successWithBaseResponse(res, subject);
  }),
);

router.delete(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    await pb.collection("notes_subjects").delete(req.params.id);

    successWithBaseResponse(res, null);
  }),
);

export default router;
