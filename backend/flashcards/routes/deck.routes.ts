import asyncWrapper from "@utils/asyncWrapper";
import { list, validate } from "@utils/CRUD";
import { successWithBaseResponse } from "@utils/response";
import express from "express";

const router = express.Router();

router.get(
  "/get/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;

    const entries = await pb.collection("flashcards_decks").getOne(id);

    successWithBaseResponse(res, entries);
  }),
);

router.get(
  "/valid/:id",
  asyncWrapper(async (req, res) => validate(req, res, "flashcards_decks")),
);

router.get(
  "/list",
  asyncWrapper(async (req, res) =>
    list(req, res, "flashcards_decks", {
      expand: "tag",
    }),
  ),
);

export default router;
