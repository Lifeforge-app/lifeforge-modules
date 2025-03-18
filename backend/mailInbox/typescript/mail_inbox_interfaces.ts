import * as s from "superstruct";
import { BasePBCollectionSchema } from "../../../src/core/typescript/pocketbase_interfaces";

const IMailInboxLabelSchema = s.assign(
  BasePBCollectionSchema,
  s.object({
    name: s.string(),
    amount: s.number(),
    parent: s.string(),
  }),
);

const IMailInboxAddressSchema = s.assign(
  BasePBCollectionSchema,
  s.object({
    name: s.string(),
    address: s.string(),
  }),
);

const IMailInboxAttachmentSchema = s.assign(
  BasePBCollectionSchema,
  s.object({
    name: s.string(),
    size: s.number(),
    file: s.string(),
  }),
);

const IMailInboxEntrySchema = s.assign(
  BasePBCollectionSchema,
  s.object({
    uid: s.number(),
    messageId: s.string(),
    subject: s.string(),
    date: s.string(),
    text: s.string(),
    html: s.optional(s.string()),
    seen: s.boolean(),
    from: s.union([
      s.object({
        name: s.string(),
        address: s.string(),
      }),
      s.string(),
    ]),
    to: s.union([
      s.array(
        s.object({
          name: s.string(),
          address: s.string(),
        }),
      ),
      s.string(),
    ]),
    cc: s.union([
      s.array(
        s.object({
          name: s.string(),
          address: s.string(),
        }),
      ),
      s.string(),
    ]),
    labels: s.array(s.string()),
    box: s.string(),
    attachments: s.union([
      s.array(
        s.object({
          name: s.string(),
          size: s.number(),
          file: s.string(),
        }),
      ),
      s.string(),
    ]),
    unsubscribeUrl: s.string(),
    expand: s.optional(
      s.object({
        mail_inbox_attachments_via_belongs_to: s.optional(
          s.array(IMailInboxAttachmentSchema),
        ),
        from: IMailInboxAddressSchema,
        to: s.optional(s.array(IMailInboxAddressSchema)),
        cc: s.optional(s.array(IMailInboxAddressSchema)),
      }),
    ),
  }),
);

type IMailInboxLabel = s.Infer<typeof IMailInboxLabelSchema>;
type IMailInboxAddress = s.Infer<typeof IMailInboxAddressSchema>;
type IMailInboxAttachment = s.Infer<typeof IMailInboxAttachmentSchema>;
type IMailInboxEntry = s.Infer<typeof IMailInboxEntrySchema>;

export {
  IMailInboxAddressSchema,
  IMailInboxAttachmentSchema,
  IMailInboxEntrySchema,
  IMailInboxLabelSchema,
};

export type {
  IMailInboxAddress,
  IMailInboxAttachment,
  IMailInboxEntry,
  IMailInboxLabel,
};
