import { getAPIKey } from "@utils/getAPIKey";
import imaps from "imap-simple";
import Pocketbase from "pocketbase";

export default async function getIMAPConfig(
  pb: Pocketbase,
): Promise<imaps.ImapSimpleOptions | null> {
  const password = await getAPIKey("gmail", pb);

  if (!password) {
    throw new Error("API key not found");
  }

  const config = {
    imap: {
      user: pb.authStore.record!.email,
      password: password,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      authTimeout: 3000,
      tlsOptions: { rejectUnauthorized: false },
    },
  };

  return config;
}
