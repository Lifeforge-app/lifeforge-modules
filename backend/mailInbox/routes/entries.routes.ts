import asyncWrapper from "@utils/asyncWrapper";
import { checkExistence } from "@utils/PBRecordValidator";
import {
  clientError,
  serverError,
  successWithBaseResponse,
} from "@utils/response";
import express, { Request, Response } from "express";
import { body, param, query } from "express-validator";
import imaps from "imap-simple";
import Pocketbase from "pocketbase";
import { BaseResponse } from "../../../src/core/typescript/base_response";
import getIMAPConfig from "../services/mailInbox/utils/getIMAPConfig";
import {
  IMailInboxEntry,
  IMailInboxLabel,
} from "../typescript/mail_inbox_interfaces";

const router = express.Router();

function cleanupRecord(
  record: IMailInboxEntry,
  pb: Pocketbase,
  removeHTML: boolean,
) {
  if (!record.expand) {
    return;
  }

  record.from = {
    name: record.expand.from.name,
    address: record.expand.from.address,
  };

  if (record.expand.to) {
    record.to = record.expand.to.map((to) => ({
      name: to.name,
      address: to.address,
    }));
  }

  if (record.expand.cc) {
    record.cc = record.expand.cc.map((cc) => ({
      name: cc.name,
      address: cc.address,
    }));
  }

  if (record.expand.mail_inbox_attachments_via_belongs_to) {
    record.attachments =
      record.expand.mail_inbox_attachments_via_belongs_to.map((attachment) => ({
        name: attachment.name,
        size: attachment.size,
        file: pb.files.getURL(attachment, attachment.file).split("/files/")[1],
      }));
  }

  delete record.expand;
  if (removeHTML) {
    delete record.html;
  }
}

function getFullPath(record: IMailInboxLabel, allRecords: IMailInboxLabel[]) {
  let path = record.name;
  let parent = record.parent;

  while (parent) {
    const parentRecord = allRecords.find((r) => r.id === parent);
    if (!parentRecord) break;

    path = `${parentRecord.name}/${path}`;
    parent = parentRecord.parent;
  }

  return path;
}

router.get(
  "/",
  [query("page").isInt().optional(), query("label").isString().optional()],
  asyncWrapper(async (req: Request, res) => {
    const { pb } = req;
    const page = parseInt((req.query.page as string) || "1");

    let label = req.query.label as string | undefined;

    if (label === "inbox") {
      const inboxLabel = await pb
        .collection("mail_inbox_labels")
        .getFirstListItem(`name = "INBOX"`);

      label = inboxLabel ? inboxLabel.id : undefined;
    }

    if (label === "trash") {
      const trashLabel = await pb
        .collection("mail_inbox_labels")
        .getFirstListItem(`name = "Trash"`);

      label = trashLabel ? trashLabel.id : undefined;
    }

    const result = await pb
      .collection("mail_inbox_entries")
      .getList<IMailInboxEntry>(page, 25, {
        filter: label ? `labels ~ "${label}"` : undefined,
        sort: "-date",
        expand: "mail_inbox_attachments_via_belongs_to, from, to, cc",
      });

    result.items.forEach((result) => {
      cleanupRecord(result, pb, true);
    });

    successWithBaseResponse(res, result);
  }),
);

router.get(
  "/:id",
  [param("id").isString().notEmpty()],
  asyncWrapper(
    async (req: Request, res: Response<BaseResponse<IMailInboxEntry>>) => {
      const { pb } = req;
      const config = await getIMAPConfig(pb);

      if (!config) {
        serverError(res, "Failed to get IMAP config");
        return;
      }

      if (
        !(await checkExistence(req, res, "mail_inbox_entries", req.params.id))
      ) {
        return;
      }

      let record = await pb
        .collection("mail_inbox_entries")
        .getOne<IMailInboxEntry>(req.params.id, {
          expand: "mail_inbox_attachments_via_belongs_to, from, to, cc",
        });

      cleanupRecord(record, pb, false);

      if (!record.seen) {
        const connection = await imaps.connect(config);
        await connection.openBox("INBOX");

        const searchCriteria = [["HEADER", "Message-ID", record.messageId]];
        const fetchOptions = {
          bodies: [],
        };

        const messages = await connection.search(searchCriteria, fetchOptions);
        if (messages.length > 0) {
          const message = messages[0];
          const uid = message.attributes.uid;

          await connection.addFlags(uid, ["\\Seen"]);

          record = await pb.collection("mail_inbox_entries").update(record.id, {
            seen: true,
          });
        }
      }

      successWithBaseResponse(res, record);
    },
  ),
);

async function copyMailMessageToTrash(
  connection: imaps.ImapSimple,
  uids: number[],
) {
  return new Promise<void>((resolve, reject) => {
    connection.imap.copy(uids, "Trash", async (err) => {
      if (err) {
        reject(err);
        return;
      }

      await connection.addFlags(uids, ["\\Deleted"]);

      resolve();
    });
  });
}

async function deleteMail(
  connection: imaps.ImapSimple,
  target: IMailInboxEntry,
  pb: Pocketbase,
  trashLabelId: string,
) {
  try {
    await connection.openBox("Trash");

    const searchCriteria = [["HEADER", "Message-ID", target.messageId]];
    const fetchOptions = {
      bodies: [],
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    if (messages.length > 0) {
      const message = messages[0];
      const uid = message.attributes.uid;

      await pb.collection("mail_inbox_entries").update(target.id, {
        box: trashLabelId,
        labels: [trashLabelId],
        uid,
      });
    }
  } catch (e) {
    console.error(e);
  }
}

router.delete(
  "/",
  [body("ids").isArray().notEmpty()],
  asyncWrapper(async (req, res) => {
    if (!req.body.ids) {
      clientError(res, "No IDs provided", 400);
      return;
    }

    const { pb } = req;
    const config = await getIMAPConfig(pb);
    if (!config) {
      serverError(res, "Failed to get IMAP config");
      return;
    }

    const connection = await imaps.connect(config);

    let trashLabel = await pb
      .collection("mail_inbox_labels")
      .getFirstListItem(`name = "Trash"`)
      .catch(() => null);

    if (!trashLabel) {
      trashLabel = await pb
        .collection("mail_inbox_labels")
        .create({ name: "Trash" });
    }

    const allLabels = await pb
      .collection("mail_inbox_labels")
      .getFullList<IMailInboxLabel>();

    const pool = [];

    const firstTarget = await pb
      .collection("mail_inbox_entries")
      .getOne<IMailInboxEntry>(req.body.ids[0]);

    await connection.openBox(
      getFullPath(
        allLabels.find((label) => label.id === firstTarget.box)!,
        allLabels,
      ),
    );

    const targets = await pb.collection("mail_inbox_entries").getFullList({
      filter: req.body.ids.map((id: string) => `id ~ "${id}"`).join(" || "),
    });

    await copyMailMessageToTrash(
      connection,
      targets.map((target) => target.uid),
    );

    for (const id of req.body.ids) {
      const target = await pb
        .collection("mail_inbox_entries")
        .getOne<IMailInboxEntry>(id);

      if (!target) {
        continue;
      }

      pool.push(deleteMail(connection, target, pb, trashLabel!.id));
    }

    await Promise.all(pool);

    await pb.collection("mail_inbox_labels").update(trashLabel!.id, {
      "count+": req.body.ids.length,
    });

    connection.imap.expunge(() => {
      successWithBaseResponse(res, undefined, 204);
      connection.end();
    });
  }),
);

router.delete(
  "/permanent",
  [body("ids").isArray().notEmpty()],
  asyncWrapper(async (req, res) => {
    if (!req.body.ids) {
      clientError(res, "No IDs provided", 400);
      return;
    }

    const { pb } = req;
    const config = await getIMAPConfig(pb);
    if (!config) {
      serverError(res, "Failed to get IMAP config");
      return;
    }

    const connection = await imaps.connect(config);

    let trashLabel = await pb
      .collection("mail_inbox_labels")
      .getFirstListItem(`name = "Trash"`)
      .catch(() => null);

    if (!trashLabel) {
      trashLabel = await pb
        .collection("mail_inbox_labels")
        .create({ name: "Trash" });
    }

    await connection.openBox("Trash");

    await connection.addFlags(req.body.ids, ["\\Deleted"]);

    connection.imap.expunge(async () => {
      const allEntries = await pb.collection("mail_inbox_entries").getFullList({
        filter: req.body.ids.map((id: string) => `id ~ "${id}"`).join(" || "),
      });

      for (const entry of allEntries) {
        await pb.collection("mail_inbox_entries").delete(entry.id);
      }

      await pb.collection("mail_inbox_labels").update(trashLabel!.id, {
        "count-": allEntries.length,
      });

      successWithBaseResponse(res, undefined, 204);
      connection.end();
    });
  }),
);

async function cleanDBTrash(trashLabelId: string, pb: Pocketbase) {
  const allTrashInDB = await pb.collection("mail_inbox_entries").getFullList({
    filter: `box = "${trashLabelId}" || labels ~ "${trashLabelId}"`,
  });

  for (const trash of allTrashInDB) {
    await pb.collection("mail_inbox_entries").delete(trash.id);
  }

  await pb.collection("mail_inbox_labels").update(trashLabelId, {
    count: 0,
  });
}

router.delete(
  "/empty-trash",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const config = await getIMAPConfig(pb);
    if (!config) {
      serverError(res, "Failed to get IMAP config");
      return;
    }

    const connection = await imaps.connect(config);

    let trashLabel = await pb
      .collection("mail_inbox_labels")
      .getFirstListItem(`name = "Trash"`)
      .catch(() => null);

    if (!trashLabel) {
      trashLabel = await pb
        .collection("mail_inbox_labels")
        .create({ name: "Trash" });
    }

    await connection.openBox("Trash");

    const searchCriteria = ["ALL"];
    const fetchOptions = {
      bodies: [],
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    const uids = messages.map((message) => message.attributes.uid);
    if (uids.length) {
      await connection.addFlags(uids, ["\\Deleted"]);

      connection.imap.expunge(async () => {
        await cleanDBTrash(trashLabel!.id, pb);
      });
    } else {
      await cleanDBTrash(trashLabel!.id, pb);
    }

    successWithBaseResponse(res, undefined, 204);
    connection.end();
  }),
);

export default router;
