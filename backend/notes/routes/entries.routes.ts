/* eslint-disable no-empty */

import asyncWrapper from "@utils/asyncWrapper";
import { clientError, successWithBaseResponse } from "@utils/response";
import express from "express";
import fs from "fs";
import { uploadMiddleware } from "../../../core/middleware/uploadMiddleware";

const router = express.Router();

router.get(
  "/get/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const note = await pb.collection("notes_entries").getOne(req.params.id);

    successWithBaseResponse(res, note);
  }),
);

router.get(
  "/list/:subject/*",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const notes = await pb.collection("notes_entries").getFullList({
      filter: `subject = "${req.params.subject}" && parent = "${req.params[0].split("/").pop()}"`,
    });

    successWithBaseResponse(res, notes);
  }),
);

router.get(
  "/valid/:workspace/:subject/*",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { totalItems: totalWorkspaceItems } = await pb
      .collection("notes_workspaces")
      .getList(1, 1, {
        filter: `id = "${req.params.workspace}"`,
      });
    const { totalItems: totalSubjectItems } = await pb
      .collection("notes_subjects")
      .getList(1, 1, {
        filter: `id = "${req.params.subject}"`,
      });

    if (!totalWorkspaceItems || !totalSubjectItems) {
      successWithBaseResponse(res, false);
      return;
    }

    const paths = req.params[0].split("/").filter((p) => p !== "");

    for (const path of paths) {
      const { totalItems: totalentriesItems } = await pb
        .collection("notes_entries")
        .getList(1, 1, {
          filter: `id = "${path}"`,
        });

      if (!totalentriesItems) {
        successWithBaseResponse(res, false);
        return;
      }
    }

    successWithBaseResponse(res, true);
  }),
);

router.get(
  "/path/:workspace/:subject/*",
  asyncWrapper(async (req, res) => {
    const { pb } = req;

    const workspace = await pb
      .collection("notes_workspaces")
      .getOne(req.params.workspace);
    const subject = await pb
      .collection("notes_subjects")
      .getOne(req.params.subject);
    const paths = req.params[0].split("/").filter((p) => p !== "");

    const result = [
      {
        id: workspace.id,
        name: workspace.name,
      },
      {
        id: subject.id,
        name: subject.title,
      },
    ];

    for (const path of paths) {
      const note = await pb.collection("notes_entries").getOne(path);
      result.push({
        id: path,
        name: note.name,
      });
    }

    successWithBaseResponse(res, {
      icon: subject.icon,
      path: result,
    });
  }),
);

router.post(
  "/create/folder",
  asyncWrapper(async (req, res) => {
    const { pb } = req;

    const { name } = req.body;
    const existing = await pb.collection("notes_entries").getFullList({
      filter: `name = "${name}" && parent = "${req.body.parent}" && subject = "${req.body.subject}"`,
    });

    if (existing.length > 0) {
      res.status(400).json({
        state: "error",
        message: "Duplicate name",
      });
      return;
    }

    const note = await pb.collection("notes_entries").create(req.body);

    successWithBaseResponse(res, note);
  }),
);

router.post(
  "/upload/:workspace/:subject/*",
  uploadMiddleware,
  asyncWrapper(async (req, res) => {
    const { pb } = req;

    if (!req.files || req.files.length === 0) {
      clientError(res, "No files provided");
    }

    for (const file of req.files as Express.Multer.File[]) {
      let parent = req.params[0].split("/").pop();

      if (file.originalname.endsWith(".DS_Store")) {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {}
        continue;
      }

      file.originalname = decodeURIComponent(file.originalname);

      const path = file.originalname.split("/");
      const name = path.pop();

      for (let i = 0; i < path.length; i += 1) {
        const existing = await pb.collection("notes_entries").getFullList({
          filter: `name = "${path[i]}" && parent = "${parent}" && subject = "${req.params.subject}"`,
        });

        if (existing.length > 0) {
          parent = existing[0].id;
        } else {
          const note = await pb.collection("notes_entries").create(
            {
              name: path[i],
              type: "folder",
              parent,
              subject: req.params.subject,
            },
            { $autoCancel: false },
          );

          parent = note.id;
        }
      }

      const existing = await pb.collection("notes_entries").getFullList({
        filter: `name = "${name}" && parent = "${parent}" && subject = "${req.params.subject}"`,
      });

      if (existing.length > 0) {
        continue;
      }

      if (fs.existsSync(file.path)) {
        const fileBuffer = fs.readFileSync(file.path);

        await pb.collection("notes_entries").create(
          {
            name,
            type: "file",
            parent,
            subject: req.params.subject,
            file: new File([fileBuffer], name ?? "notes", {
              type: file.mimetype,
            }),
          },
          { $autoCancel: false },
        );

        try {
          fs.unlinkSync(file.path);
        } catch (error) {}
      }
    }

    successWithBaseResponse(res, null);
  }),
);

router.patch(
  "/update/folder/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const note = await pb
      .collection("notes_entries")
      .update(req.params.id, req.body);

    successWithBaseResponse(res, note);
  }),
);

router.delete(
  "/delete/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    await pb.collection("notes_entries").delete(req.params.id);

    successWithBaseResponse(res, null);
  }),
);

export default router;
