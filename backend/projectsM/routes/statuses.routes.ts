import asyncWrapper from "@utils/asyncWrapper";
import { list } from "@utils/CRUD";
import { checkExistence } from "@utils/PBRecordValidator";
import { successWithBaseResponse } from "@utils/response";
import express, { Response } from "express";
import { body } from "express-validator";
import { BaseResponse } from "../../../core/typescript/base_response";
import { IProjectsMStatus } from "../typescript/projects_m_interfaces";

const router = express.Router();

router.get(
  "/",
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMStatus[]>>) =>
    list(req, res, "projects_m_statuses"),
  ),
);

router.post(
  "/",
  [
    body("name").isString(),
    body("icon").isString(),
    body("color").isHexColor(),
  ],
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMStatus>>) => {
    const { pb } = req;
    const { name, icon, color } = req.body;

    const status: IProjectsMStatus = await pb
      .collection("projects_m_statuses")
      .create({
        name,
        icon,
        color,
      });

    successWithBaseResponse(res, status);
  }),
);

router.patch(
  "/:id",
  [
    body("name").isString(),
    body("icon").isString(),
    body("color").isHexColor(),
  ],
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMStatus>>) => {
    const { pb } = req;
    const { id } = req.params;
    const { name, icon, color } = req.body;

    if (!(await checkExistence(req, res, "projects_m_statuses", id))) {
      return;
    }

    const status: IProjectsMStatus = await pb
      .collection("projects_m_statuses")
      .update(id, {
        name,
        icon,
        color,
      });

    successWithBaseResponse(res, status);
  }),
);

router.delete(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;

    if (!(await checkExistence(req, res, "projects_m_statuses", id))) {
      return;
    }

    await pb.collection("projects_m_statuses").delete(id);

    successWithBaseResponse(res, undefined, 204);
  }),
);

export default router;
