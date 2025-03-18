import asyncWrapper from "@utils/asyncWrapper";
import { list } from "@utils/CRUD";
import express from "express";

const router = express.Router();

router.get(
  "/list",
  asyncWrapper(async (req, res) => list(req, res, "flashcards_tags")),
);

export default router;
