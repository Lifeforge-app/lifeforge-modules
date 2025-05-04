import asyncWrapper from "@utils/asyncWrapper";
import { list, validate } from "@utils/CRUD";
import { checkExistence } from "@utils/PBRecordValidator";
import { successWithBaseResponse } from "@utils/response";
import express, { Response } from "express";
import { body } from "express-validator";
import { BaseResponse } from "../../../core/typescript/base_response";
import { IProjectsMEntry } from "../typescript/projects_m_interfaces";

const router = express.Router();

router.get(
  "/",
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMEntry[]>>) =>
    list(req, res, "projects_m_entries"),
  ),
);

router.get(
  "/:id",
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMEntry>>) => {
    const { pb } = req;
    const { id } = req.params;

    const entry: IProjectsMEntry = await pb
      .collection("projects_m_entries")
      .getOne(id);

    successWithBaseResponse(res, entry);
  }),
);

router.get(
  "/valid/:id",
  asyncWrapper(async (req, res) => validate(req, res, "projects_m_entries")),
);

router.post(
  "/",
  [
    body("name").isString(),
    body("icon").isString(),
    body("color").isHexColor(),
    body("visibility").isString().optional(),
    body("status").isString().optional(),
    body("category").isString().optional(),
    body("technologies").isArray().optional(),
  ],
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMEntry>>) => {
    const { pb } = req;
    const { name, icon, color, visibility, status, category, technologies } =
      req.body;

    const visibilityExists = await checkExistence(
      req,
      res,
      "projects_m_visibilities",
      visibility,
    );
    const statusExists = await checkExistence(
      req,
      res,
      "projects_m_statuses",
      status,
    );
    const categoryExists = await checkExistence(
      req,
      res,
      "projects_m_categories",
      category,
    );

    let technologiesExist = true;

    for (const tech of technologies || []) {
      const techExists = await checkExistence(
        req,
        res,
        "projects_m_technologies",
        tech,
      );

      if (!techExists) {
        technologiesExist = false;
        break;
      }
    }

    if (
      !visibilityExists ||
      !statusExists ||
      !categoryExists ||
      !technologiesExist
    ) {
      return;
    }

    const entry: IProjectsMEntry = await pb
      .collection("projects_m_entries")
      .create({
        name,
        icon,
        color,
        visibility,
        status,
        category,
        technologies,
      });

    successWithBaseResponse(res, entry);
  }),
);

router.patch(
  "/:id",
  [
    body("name").isString(),
    body("icon").isString(),
    body("color").isHexColor(),
    body("visibility").isString().optional(),
    body("status").isString().optional(),
    body("category").isString().optional(),
    body("technologies").isArray().optional(),
  ],
  asyncWrapper(async (req, res: Response<BaseResponse<IProjectsMEntry>>) => {
    const { pb } = req;
    const { id } = req.params;
    const { name, icon, color, visibility, status, category, technologies } =
      req.body;

    const visibilityExists = await checkExistence(
      req,
      res,
      "projects_m_visibilities",
      visibility,
    );
    const statusExists = await checkExistence(
      req,
      res,
      "projects_m_statuses",
      status,
    );
    const categoryExists = await checkExistence(
      req,
      res,
      "projects_m_categories",
      category,
    );

    let technologiesExist = true;

    for (const tech of technologies || []) {
      const techExists = await checkExistence(
        req,
        res,
        "projects_m_technologies",
        tech,
      );

      if (!techExists) {
        technologiesExist = false;
        break;
      }
    }

    if (
      !visibilityExists ||
      !statusExists ||
      !categoryExists ||
      !technologiesExist
    ) {
      return;
    }

    const entries: IProjectsMEntry = await pb
      .collection("projects_m_entries")
      .update(id, {
        name,
        icon,
        color,
        visibility,
        status,
        category,
        technologies,
      });

    successWithBaseResponse(res, entries);
  }),
);

router.delete(
  "/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;

    await pb.collection("projects_m_entries").delete(id);

    successWithBaseResponse(res);
  }),
);

export default router;
