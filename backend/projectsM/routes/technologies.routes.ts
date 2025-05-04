import asyncWrapper from "@utils/asyncWrapper";
import { list } from "@utils/CRUD";
import { successWithBaseResponse } from "@utils/response";
import express, { Response } from "express";
import { body } from "express-validator";
import { BaseResponse } from "../../../core/typescript/base_response";
import { IProjectsMTechnology } from "../typescript/projects_m_interfaces";

const router = express.Router();

router.get(
  "/",
  asyncWrapper(
    async (req, res: Response<BaseResponse<IProjectsMTechnology[]>>) =>
      list(req, res, "projects_m_technologies", {
        sort: "name",
      }),
  ),
);

router.post(
  "/",
  [body("name").isString(), body("icon").isString()],
  asyncWrapper(
    async (req, res: Response<BaseResponse<IProjectsMTechnology>>) => {
      const { pb } = req;
      const { name, icon } = req.body;

      const technology: IProjectsMTechnology = await pb
        .collection("projects_m_technologies")
        .create({
          name,
          icon,
        });

      successWithBaseResponse(res, technology);
    },
  ),
);

router.patch(
  "/:id",
  [body("name").isString(), body("icon").isString()],
  asyncWrapper(
    async (req, res: Response<BaseResponse<IProjectsMTechnology>>) => {
      const { pb } = req;
      const { id } = req.params;
      const { name, icon } = req.body;

      const technology: IProjectsMTechnology = await pb
        .collection("projects_m_technologies")
        .update(id, {
          name,
          icon,
        });

      successWithBaseResponse(res, technology);
    },
  ),
);

router.delete(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;

    await pb.collection("projects_m_technologies").delete(id);

    successWithBaseResponse(res);
  }),
);

export default router;
