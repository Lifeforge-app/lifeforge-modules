import asyncWrapper from "@utils/asyncWrapper";
import { fetchAI } from "@utils/fetchAI";
import { getAPIKey } from "@utils/getAPIKey";
import { clientError, successWithBaseResponse } from "@utils/response";
import express from "express";
import JSDOM from "jsdom";
import FIRs from "../data/FIRs";
import notamnDecoder from "../utils/notamdecoder";

const router = express.Router();

router.get(
  "/NOTAM/:NOTAMID",
  asyncWrapper(async (req, res) => {
    const { NOTAMID } = req.params;
    try {
      const response = await fetch(
        `https://metar-taf.com/notam/${NOTAMID}?frame=1`,
      ).then((res) => res.text());

      const dom = new JSDOM.JSDOM(response);

      const NOTAM = dom.window.document.querySelector("pre")?.innerHTML;

      if (!NOTAM) {
        successWithBaseResponse(res, "none");
        return;
      }

      const result = notamnDecoder.decode(NOTAM);

      result.raw = NOTAM;

      if (result.qualification && result.qualification.location) {
        result.qualification.location = [
          result.qualification.location,
          FIRs[result.qualification.location as keyof typeof FIRs],
        ];
      }

      successWithBaseResponse(res, result);
    } catch (err) {
      successWithBaseResponse(res, "none");
    }
  }),
);

router.get(
  "/NOTAM/:NOTAMID/summarize",
  asyncWrapper(async (req, res) => {
    const key = await getAPIKey("groq", req.pb);

    if (!key) {
      clientError(res, "API key not found");
      return;
    }

    const { NOTAMID } = req.params;

    const response = await fetch(
      `https://metar-taf.com/notam/${NOTAMID}?frame=1`,
    ).then((res) => res.text());

    const dom = new JSDOM.JSDOM(response);

    const NOTAM = dom.window.document.querySelector("pre")?.innerHTML;

    const prompt = `
              Please summarize the following NOTAM (Notice to Airmen) data into a concise and easy-to-understand format, including:
  
                  Location
                  Dates and times of operation
                  Type of activity or operation
                  Coordinates or area affected
                  Altitude or height restrictions
                  Any additional remarks or notes
  
              Please provide a clear and concise summary that can be easily understood by pilots, air traffic controllers, and other aviation professionals.
              
              ${NOTAM}
              `;

    let MAX_RETRY = 5;

    while (MAX_RETRY > 0) {
      try {
        const text = await fetchAI({
          provider: "groq",
          apiKey: key,
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });
        if (!text) throw new Error("No response");

        successWithBaseResponse(res, text);
        return;
      } catch {
        MAX_RETRY--;
        continue;
      }
    }
  }),
);

export default router;
