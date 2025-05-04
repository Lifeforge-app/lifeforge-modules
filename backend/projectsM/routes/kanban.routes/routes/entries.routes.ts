import asyncWrapper from "@utils/asyncWrapper";
import { successWithBaseResponse } from "@utils/response";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { BaseResponse } from "../../../../../core/typescript/base_response";
import { IProjectsMKanbanEntry } from "../../../typescript/projects_m_interfaces";

const router = express.Router();

router.post(
  "/:columnId",
  [body("title").isString()],
  asyncWrapper(
    async (
      req: Request,
      res: Response<BaseResponse<IProjectsMKanbanEntry>>,
    ) => {
      const { pb } = req;
      const { title } = req.body;
      const { columnId } = req.params;

      const entry: IProjectsMKanbanEntry = await pb
        .collection("projects_m_kanban_entries")
        .create({
          column: columnId,
          title,
        });

      successWithBaseResponse(res, entry);
    },
  ),
);

router.patch(
  "/:id",
  asyncWrapper(
    async (
      req: Request,
      res: Response<BaseResponse<IProjectsMKanbanEntry>>,
    ) => {
      const { pb } = req;
      const { id } = req.params;
      const { title } = req.body;

      const column: IProjectsMKanbanEntry = await pb
        .collection("projects_m_kanban_entries")
        .update(id, {
          title,
        });

      successWithBaseResponse(res, column);
    },
  ),
);

router.delete(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;

    await pb.collection("projects_m_kanban_entries").delete(id);

    successWithBaseResponse(res);
  }),
);

export default router;
