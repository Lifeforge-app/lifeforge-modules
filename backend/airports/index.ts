import asyncWrapper from "@utils/asyncWrapper";
import { clientError, successWithBaseResponse } from "@utils/response";
import express from "express";
import fs from "fs";
import COUNTRIES from "./data/countries";
import REGIONS from "./data/regions";
import airportRoutes from "./routes/airport.routes";
import NOTAMRoutes from "./routes/NOTAM.routes";

const CONTINENTS_NAME = {
  AF: "Africa",
  AN: "Antarctica",
  AS: "Asia",
  EU: "Europe",
  NA: "North America",
  OC: "Oceania",
  SA: "South America",
};

const AIRPORT_DATA: string[][] = JSON.parse(
  fs.readFileSync("src/routes/airports/data/airports.json").toString(),
).slice(1);

const router = express.Router();

router.use("/airport", airportRoutes);
router.use("/NOTAM", NOTAMRoutes);

router.get(
  "/search",
  asyncWrapper(async (req, res) => {
    let { query } = req.query as {
      query: string;
    };

    if (!query) {
      clientError(res, "Query is required");
      return;
    }

    query = decodeURIComponent(query).toLowerCase();

    const result = AIRPORT_DATA.filter((airport) => {
      const continentName =
        CONTINENTS_NAME[airport[7] as keyof typeof CONTINENTS_NAME];
      const countryName = COUNTRIES[airport[8]]?.toLowerCase();
      const regionName =
        REGIONS[airport[9] as keyof typeof REGIONS].toLowerCase();
      const locationName = airport[10].toLowerCase();
      const airportName = airport[3].toLowerCase();
      const icao = airport[12].toLowerCase();
      const iata = airport[13].toLowerCase();

      return (
        continentName.includes(query) ||
        countryName?.includes(query) ||
        regionName.includes(query) ||
        locationName.includes(query) ||
        airportName.includes(query) ||
        iata.includes(query) ||
        icao.includes(query)
      );
    })
      .map((airport) => ({
        id: airport[1],
        name: airport[3],
        continentCode: airport[7],
        country: {
          code: airport[8],
          name: COUNTRIES[airport[8]],
        },
        region: {
          code: airport[9],
          name: REGIONS[airport[9] as keyof typeof REGIONS],
        },
        locationName: airport[10],
        iata: airport[13],
        icao: airport[12],
        type: airport[2],
        match: (() => {
          const continentName =
            CONTINENTS_NAME[
              airport[7] as keyof typeof CONTINENTS_NAME
            ].toLowerCase();
          const countryName = COUNTRIES[airport[8]]?.toLowerCase();
          const regionName =
            REGIONS[airport[9] as keyof typeof REGIONS].toLowerCase();
          const locationName = airport[10].toLowerCase();
          const airportName = airport[3].toLowerCase();
          const icao = airport[12].toLowerCase();
          const iata = airport[13].toLowerCase();

          if (iata.includes(query)) return "iata";
          if (icao.includes(query)) return "icao";
          if (airportName.includes(query)) return "name";
          if (locationName.includes(query)) return "location";
          if (regionName.includes(query)) return "region";
          if (countryName.includes(query)) return "country";
          if (continentName.includes(query)) return "continent";
        })(),
      }))
      .sort(
        (a, b) =>
          [
            "large_airport",
            "medium_airport",
            "small_airport",
            "heliport",
            "seaplane_base",
            "balloonport",
            "closed",
          ].indexOf(a.type) -
          [
            "large_airport",
            "medium_airport",
            "small_airport",
            "heliport",
            "seaplane_base",
            "balloonport",
            "closed",
          ].indexOf(b.type),
      )
      .sort((a: any, b: any) => {
        if (!a.match || !b.match) return 0;

        return (
          [
            "iata",
            "icao",
            "name",
            "location",
            "region",
            "country",
            "continent",
          ].indexOf(a.match) -
          [
            "iata",
            "icao",
            "name",
            "location",
            "region",
            "country",
            "continent",
          ].indexOf(b.match)
        );
      })
      .slice(0, 10);

    successWithBaseResponse(res, result);
  }),
);

router.get(
  "/continents",
  asyncWrapper(async (req, res) => {
    const result = AIRPORT_DATA.reduce(
      (acc: Record<string, number>, airport) => {
        if (!acc[airport[7]]) {
          acc[airport[7]] = 1;
        } else {
          acc[airport[7]]++;
        }

        return acc;
      },
      {},
    );

    successWithBaseResponse(res, result);
  }),
);

router.get(
  "/countries/:id",
  asyncWrapper(async (req, res) => {
    const { id } = req.params;

    if (!["AF", "AN", "AS", "EU", "NA", "OC", "SA"].includes(id)) {
      clientError(res, "Invalid continent");
      return;
    }

    const result = AIRPORT_DATA.reduce(
      (acc: Record<string, number>, airport) => {
        if (airport[7] === id) {
          const country = airport[8];
          if (!acc[country]) {
            acc[country] = 1;
          } else {
            acc[country]++;
          }
        }

        return acc;
      },
      {},
    );

    const final = Object.fromEntries(
      Object.keys(result).map((country) => [
        country,
        [COUNTRIES[country], result[country]],
      ]),
    );

    successWithBaseResponse(res, final);
  }),
);

router.get(
  "/regions/:id",
  asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const result = AIRPORT_DATA.reduce(
      (acc: Record<string, number>, airport) => {
        if (airport[8] === id) {
          const region = airport[9];
          if (!acc[region]) {
            acc[region] = 1;
          } else {
            acc[region]++;
          }
        }

        return acc;
      },
      {},
    );

    const final = Object.fromEntries(
      Object.keys(result).map((region) => [
        region,
        [REGIONS[region as keyof typeof REGIONS], result[region]],
      ]),
    );

    const breadcrumbs = [COUNTRIES[Object.keys(final)[0].split("-")[0]]];

    successWithBaseResponse(res, {
      data: final,
      breadcrumbs,
    });
  }),
);

export default router;
