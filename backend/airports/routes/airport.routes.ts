import asyncWrapper from "@utils/asyncWrapper";
import { clientError, successWithBaseResponse } from "@utils/response";
import express, { Response } from "express";
import fs from "fs";
import JSDOM from "jsdom";
import COUNTRIES from "../data/countries";
import REGIONS from "../data/regions";
import { IFlightDataEntry } from "../typescript/airports_interfaces";
// @ts-expect-error don't have types for this
import metarParser from "aewx-metar-parser";
import { param, query } from "express-validator";
import { BaseResponse } from "../../../src/core/typescript/base_response";

const AIRPORT_DATA: string[][] = JSON.parse(
  fs.readFileSync("src/routes/airports/data/airports.json").toString(),
).slice(1);

const cache = new Map();

const router = express.Router();

router.get(
  "/list/:id",
  [param("id").custom((value) => Object.keys(REGIONS).includes(value))],
  asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const result = AIRPORT_DATA.filter((airport) => airport[9] === id).map(
      (airport) => ({
        id: airport[1],
        location: airport[10],
        type: airport[2],
        name: airport[3],
      }),
    );

    const breadcrumbs = [
      COUNTRIES[id.split("-")[0]],
      REGIONS[id as keyof typeof REGIONS],
    ];

    successWithBaseResponse(res, {
      data: result,
      breadcrumbs,
    });
  }),
);

router.get(
  "/:id",
  [
    param("id").custom((value) =>
      AIRPORT_DATA.map((airport) => airport[1]).includes(value),
    ),
  ],
  asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const result = AIRPORT_DATA.find((airport) => airport[1] === id)!;

    const final = {
      id: result[1],
      type: result[2],
      name: result[3],
      iata: result[13],
      icao: result[12],
      latitude: result[4],
      longitude: result[5],
      elevation: result[6],
      website: result[15],
      wikipedia: result[16],
      has_airline_service: result[11] === "yes",
    };

    const breadcrumbs = [
      COUNTRIES[result[8]],
      REGIONS[result[9] as keyof typeof REGIONS],
      result[10],
      final.name,
    ];

    successWithBaseResponse(res, {
      data: final,
      breadcrumbs,
    });
  }),
);

router.get(
  "/:id/flights/:type",
  [
    param("id").isString(),
    param("type").isIn(["arrivals", "departures"]),
    query("page").optional().isNumeric(),
  ],
  asyncWrapper(async (req, res: Response<BaseResponse<IFlightDataEntry[]>>) => {
    const { id, type } = req.params;
    const { page } = req.query;

    if (!["arrivals", "departures"].includes(type)) {
      clientError(res, "Invalid type");
      return;
    }

    if (page && isNaN(parseInt(page as string))) {
      clientError(res, "Invalid page");
      return;
    }

    const flightIDKey = `airport/${id}/flights/${type}/${page}`;

    if (
      cache.has(flightIDKey) &&
      Number(new Date()) - cache.get(flightIDKey).lastFetch < 1000 * 60
    ) {
      successWithBaseResponse(res, cache.get(flightIDKey).data);
      return;
    }

    const rawData = await fetch(
      `https://www.avionio.com/widget/en/${id}/${type}?page=${page || 0}`,
    ).then((res) => res.text());

    const dom = new JSDOM.JSDOM(rawData);

    const flights: IFlightDataEntry[] = [];

    dom.window.document.querySelectorAll(".tt-row").forEach((row) => {
      if (row.classList.contains("tt-child")) return;

      const flight: IFlightDataEntry = {
        time: row.querySelector(".tt-t")?.textContent?.trim() ?? "",
        date: row.querySelector(".tt-d")?.textContent?.trim() ?? "",
        origin: {
          iata:
            row
              .querySelector(".tt-i a")
              ?.attributes.getNamedItem("title")
              ?.value.trim() ?? "",
          name: row.querySelector(".tt-ap")?.textContent?.trim() ?? "",
        },
        flightNumber: row.querySelector(".tt-f a")?.textContent?.trim() ?? "",
        airline:
          row
            .querySelector(".tt-al")
            ?.textContent?.replace(/\s+\d+$/, "")
            .trim() ?? "",
        status: row.querySelector(".tt-s")?.textContent?.trim() ?? "",
      };

      const timeDetails = row.querySelector(".tt-s");
      if (timeDetails?.classList.contains("estimated")) {
        flight.estimatedTime = timeDetails.textContent
          ?.replace("Estimated ", "")
          .trim();
      } else if (timeDetails?.classList.contains("scheduled")) {
        flight.scheduledTime = timeDetails.textContent
          ?.replace("Scheduled ", "")
          .trim();
      }

      flights.push(flight);
    });

    cache.set(flightIDKey, {
      data: flights,
      lastFetch: new Date(),
    });

    successWithBaseResponse(res, flights);
  }),
);

router.get(
  "/:id/METAR",
  [
    param("id").custom((value) =>
      AIRPORT_DATA.map((airport) => airport[1]).includes(value),
    ),
  ],
  asyncWrapper(async (req, res) => {
    const { id } = req.params;

    try {
      const response = await fetch(`https://metar-taf.com/${id}`).then((res) =>
        res.text(),
      );

      const dom = new JSDOM.JSDOM(response);

      const metar = dom.window.document.querySelector("code")?.textContent;

      const parsedMETAR = metarParser(metar);

      successWithBaseResponse(res, parsedMETAR);
    } catch {
      try {
        const response = await fetch(
          `https://tgftp.nws.noaa.gov/data/observations/metar/stations/${id}.TXT`,
        ).then((res) => res.text());

        const data = response.trim();
        const metar = data.split("\n")[1];

        const parsedMETAR = metarParser(metar);

        successWithBaseResponse(res, parsedMETAR);
      } catch {
        successWithBaseResponse(res, "none");
      }
    }
  }),
);

router.get(
  "/:id/NOTAM",
  [
    param("id").custom((value) =>
      AIRPORT_DATA.map((airport) => airport[1]).includes(value),
    ),
    query("page").optional().isNumeric(),
  ],
  asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const page = req.query.page ?? "-1";

    try {
      const response = await fetch(
        `https://metar-taf.com/notams/${id}?page=${page}`,
      ).then((res) => res.text());

      if (response === "DONE") {
        successWithBaseResponse(res, []);
        return;
      }

      const dom = new JSDOM.JSDOM(response);

      const NOTAMs = Array.from(dom.window.document.querySelectorAll("a")).map(
        (e) => {
          const title = e.querySelector("h5");
          const status = title?.nextElementSibling;
          const distance = status?.nextElementSibling;
          const time = distance?.nextElementSibling;
          const codeSummary = e.querySelector("pre");
          const duration = codeSummary?.nextSibling;

          return {
            id: e.href.replace("/notam/", ""),
            title: title?.innerHTML
              .replace(/<.*?span.*?>/g, "")
              .split("·")
              .map((e) => e.trim()),
            status: status?.innerHTML,
            distance: distance?.innerHTML.trim(),
            time: time?.innerHTML.replace("&gt;", ">"),
            codeSummary: codeSummary?.innerHTML,
            duration: duration?.textContent,
          };
        },
      );

      successWithBaseResponse(res, NOTAMs);
    } catch (err) {
      successWithBaseResponse(res, "none");
    }
  }),
);

router.get(
  "/:id/radios",
  [
    param("id").custom((value) =>
      AIRPORT_DATA.map((airport) => airport[1]).includes(value),
    ),
  ],
  asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const response = await fetch(
      `https://www.liveatc.net/search/?icao=${id}`,
    ).then((res) => res.text());

    const dom = new JSDOM.JSDOM(response);

    const radios = Array.from(
      dom.window.document.querySelectorAll(".freqTable tr"),
    )
      .slice(1)
      .map((radio) => {
        const [name, frequency] = radio.querySelectorAll("td");

        return {
          name: name.textContent,
          frequency: frequency.textContent,
        };
      });

    successWithBaseResponse(res, radios);
  }),
);

router.get(
  "/:id/runways",
  [
    param("id").custom((value) =>
      AIRPORT_DATA.map((airport) => airport[1]).includes(value),
    ),
  ],
  asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const response = await fetch(
      `http://www.airport-data.com/world-airports/${id}`,
    ).then((res) => res.text());

    const dom = new JSDOM.JSDOM(response);

    const runwayNames = Array.from(
      dom.window.document.querySelectorAll("section#runway h3"),
    ).map((e) => e.textContent);

    const runwaysInfo = Array.from(
      dom.window.document.querySelectorAll("section#runway table"),
    ).map((table) =>
      table.outerHTML.replace(/class=".*?"/g, "").replace(/width=".*?"/g, ""),
    );

    const runways = runwayNames.map((name, i) => ({
      name,
      info: runwaysInfo[i],
    }));

    successWithBaseResponse(res, runways);
  }),
);

export default router;
