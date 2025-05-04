import asyncWrapper from "@utils/asyncWrapper";
import { successWithBaseResponse } from "@utils/response";
import express, { Request, Response } from "express";
import { body } from "express-validator";
import { BaseResponse } from "../../../../../core/typescript/base_response";
import {
  IProjectsMKanbanColumn,
  IProjectsMKanbanEntry,
} from "../../../typescript/projects_m_interfaces";

const router = express.Router();

router.get(
  "/:projectId",
  asyncWrapper(
    async (
      req: Request,
      res: Response<BaseResponse<IProjectsMKanbanColumn[]>>,
    ) => {
      const { pb } = req;
      const { projectId } = req.params;

      const columns: (IProjectsMKanbanColumn & {
        expand?: {
          projects_m_kanban_entries_via_column: IProjectsMKanbanEntry[];
        };
      })[] = await pb.collection("projects_m_kanban_columns").getFullList({
        filter: `project="${projectId}"`,
        expand: "projects_m_kanban_entries_via_column",
      });

      columns.forEach((column) => {
        if (column.expand) {
          column.entries = column.expand.projects_m_kanban_entries_via_column;
          delete column.expand;
        }
      });

      successWithBaseResponse(res, columns as IProjectsMKanbanColumn[]);
    },
  ),
);

router.post(
  "/:projectId",
  [
    body("name").isString(),
    body("icon").isString(),
    body("color").isHexColor(),
  ],
  asyncWrapper(
    async (
      req: Request,
      res: Response<BaseResponse<IProjectsMKanbanColumn>>,
    ) => {
      const { pb } = req;
      const { name, icon, color } = req.body;
      const { projectId } = req.params;

      const column: IProjectsMKanbanColumn = await pb
        .collection("projects_m_kanban_columns")
        .create({
          name,
          icon,
          color,
          project: projectId,
        });

      successWithBaseResponse(res, column);
    },
  ),
);

router.patch(
  "/:id",
  asyncWrapper(
    async (
      req: Request,
      res: Response<BaseResponse<IProjectsMKanbanColumn>>,
    ) => {
      const { pb } = req;
      const { id } = req.params;
      const { name, icon, color } = req.body;

      const column: IProjectsMKanbanColumn = await pb
        .collection("projects_m_kanban_columns")
        .update(id, {
          name,
          icon,
          color,
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

    await pb.collection("projects_m_kanban_columns").delete(id);

    successWithBaseResponse(res);
  }),
);

export default router;
