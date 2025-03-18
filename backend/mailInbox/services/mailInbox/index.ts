import imaps from "imap-simple";
import moment from "moment";
import Pocketbase from "pocketbase";
import { createMailRecord } from "./utils/createMailRecord";
import getIMAPConfig from "./utils/getIMAPConfig";

if (!process.env.PB_HOST || !process.env.PB_EMAIL || !process.env.PB_PASSWORD) {
  throw new Error("Please provide PB_HOST, PB_EMAIL and PB_PASSWORD in .env");
}

const pb = new Pocketbase(process.env.PB_HOST);

await pb
  .collection("_superusers")
  .authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

const config = await getIMAPConfig(pb);

if (!config) {
  throw new Error("Failed to get IMAP config");
}

async function fetchMail(connection: imaps.ImapSimple) {
  let lastUIDRecord = await pb
    .collection("mail_inbox_entries")
    .getList<any>(1, 1, {
      skipTotal: true,
      sort: "-created",
    })
    .catch(() => null);

  let lastTime = moment().subtract(1, "hour");
  if (lastUIDRecord && lastUIDRecord.items.length > 0) {
    lastTime = moment(lastUIDRecord.items[0].date);
  }

  const searchCriteria = [["SINCE", lastTime.format("DD-MMM-YYYY")]];

  const fetchOptions = {
    bodies: [""],
    markSeen: false,
    struct: true,
  };
  const messages = await connection.openBox("INBOX").then(() => {
    return connection.search(searchCriteria, fetchOptions);
  });

  for (const message of messages) {
    await createMailRecord(message, pb);
  }
}

export async function watchInbox() {
  try {
    const connection = await imaps.connect(config!);
    await connection.openBox("INBOX");

    connection.on("mail", () => {
      fetchMail(connection);
    });

    connection.on("error", (err) => {
      console.error("IMAP connection error:", err);
      connection.end();
      setTimeout(watchInbox, 10000);
    });
  } catch (error) {
    console.error("Error watching inbox:", error);
  }
}

export async function fetchOnce() {
  try {
    const connection = await imaps.connect(config!);
    await connection.openBox("INBOX");

    await fetchMail(connection);

    connection.end();
  } catch (error) {
    console.error("Error fetching mail:", error);
  }
}

fetchOnce();
