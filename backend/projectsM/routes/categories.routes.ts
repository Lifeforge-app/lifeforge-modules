import asyncWrapper from "@utils/asyncWrapper";
import { list } from "@utils/CRUD";
import { successWithBaseResponse } from "@utils/response";
import express, { Response } from "express";
import { body } from "express-validator";
import { BaseResponse } from "../../../core/typescript/base_response";
import { IProjectsMCategory } from "../typescript/projects_m_interfaces";

const router = express.Router();

router.get(
  "/",
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMCategory[]>>) =>
    list(req, res, "projects_m_categories"),
  ),
);

router.post(
  "/",
  [body("name").isString(), body("icon").isString()],
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMCategory>>) => {
    const { pb } = req;
    const { name, icon } = req.body;

    const category: IProjectsMCategory = await pb
      .collection("projects_m_categories")
      .create({
        name,
        icon,
      });

    successWithBaseResponse(res, category);
  }),
);

router.patch(
  "/:id",
  [body("name").isString(), body("icon").isString()],
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMCategory>>) => {
    const { pb } = req;
    const { id } = req.params;
    const { name, icon } = req.body;

    const category: IProjectsMCategory = await pb
      .collection("projects_m_categories")
      .update(id, {
        name,
        icon,
      });

    successWithBaseResponse(res, category);
  }),
);

router.delete(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;

    await pb.collection("projects_m_categories").delete(id);

    successWithBaseResponse(res);
  }),
);

export default router;
