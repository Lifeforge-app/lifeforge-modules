import asyncWrapper from "@utils/asyncWrapper";
import { list } from "@utils/CRUD";
import { successWithBaseResponse } from "@utils/response";
import express, { Response } from "express";
import { body } from "express-validator";
import { BaseResponse } from "../../../core/typescript/base_response";
import { IProjectsMVisibility } from "../typescript/projects_m_interfaces";

const router = express.Router();

router.get(
  "/",
  asyncWrapper(
    async (req, res: Response<BaseResponse<IProjectsMVisibility[]>>) =>
      list(req, res, "projects_m_visibilities"),
  ),
);

router.post(
  "/",
  [body("name").isString(), body("icon").isString()],
  asyncWrapper(
    async (req, res: Response<BaseResponse<IProjectsMVisibility>>) => {
      const { pb } = req;
      const { name, icon } = req.body;

      const visibility: IProjectsMVisibility = await pb
        .collection("projects_m_visibilities")
        .create({
          name,
          icon,
        });

      successWithBaseResponse(res, visibility);
    },
  ),
);

router.patch(
  "/:id",
  asyncWrapper(
    async (req, res: Response<BaseResponse<IProjectsMVisibility>>) => {
      const { pb } = req;
      const { id } = req.params;
      const { name, icon } = req.body;

      const visibility: IProjectsMVisibility = await pb
        .collection("projects_m_visibilities")
        .update(id, {
          name,
          icon,
        });

      successWithBaseResponse(res, visibility);
    },
  ),
);

router.delete(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;

    await pb.collection("projects_m_visibilities").delete(id);

    successWithBaseResponse(res);
  }),
);

export default router;
