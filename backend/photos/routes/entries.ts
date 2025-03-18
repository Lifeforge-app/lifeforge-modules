// @ts-nocheck
import express from "express";

import asyncWrapper from "@utils/asyncWrapper";
import { clientError, successWithBaseResponse } from "@utils/response";
import ExifReader from "exifreader";
import fs from "fs";
import sizeOf from "image-size";
import mime from "mime-types";
import moment from "moment";

const router = express.Router();

const RAW_FILE_TYPE = [
  "ARW",
  "CR2",
  "CR3",
  "CRW",
  "DCR",
  "DNG",
  "ERF",
  "K25",
  "KDC",
  "MRW",
  "NEF",
  "ORF",
  "PEF",
  "RAF",
  "RAW",
  "SR2",
  "SRF",
  "X3F",
];

let progress: {
  total: number;
  done: number;
} | null = null;
let allPhotosDimensions = undefined;

router.get(
  "/name/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;
    const { isInAlbum } = req.query;

    if (!pb.authStore.isValid) {
      await pb
        .collection("_superusers")
        .authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

      let image;

      if (isInAlbum === "true") {
        const dim = await pb.collection("photos_dimensions").getOne(id);
        image = await pb.collection("photos_entries").getOne(dim.photo);
        const album = await pb.collection("photos_albums").getOne(image.album);

        if (!album.is_public) {
          res.status(401).json({
            state: "error",
            message: "Invalid authorization credentials",
          });
          return;
        }
      } else {
        res.status(401).json({
          state: "error",
          message: "Invalid authorization credentials",
        });
        return;
      }
    }

    let image;

    if (isInAlbum === "true") {
      const dim = await pb.collection("photos_dimensions").getOne(id);
      image = await pb.collection("photos_entries").getOne(dim.photo);
    } else {
      image = await pb.collection("photos_entries").getOne(id);
    }

    successWithBaseResponse(res, image.name);
  }),
);

router.get(
  "/download/:id",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { id } = req.params;
    const { raw, isInAlbum } = req.query;

    if (!pb.authStore.isValid) {
      await pb
        .collection("_superusers")
        .authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

      let image;

      if (isInAlbum === "true") {
        const dim = await pb.collection("photos_dimensions").getOne(id);
        image = await pb.collection("photos_entries").getOne(dim.photo);
        const album = await pb.collection("photos_albums").getOne(image.album);

        if (!album.is_public) {
          res.status(401).json({
            state: "error",
            message: "Invalid authorization credentials",
          });
        }
      } else {
        res.status(401).json({
          state: "error",
          message: "Invalid authorization credentials",
        });
      }
    }

    let image;

    if (isInAlbum === "true") {
      const dim = await pb.collection("photos_dimensions").getOne(id);
      image = await pb.collection("photos_entries").getOne(dim.photo);
    } else {
      image = await pb.collection("photos_entries").getOne(id);
    }

    const url = pb.files
      .getUrl(
        image,
        image[
          raw === "true" ? "raw" : "image"
          //TODO
        ],
      )
      .replace(
        "http://dev.lifeforge.thecodeblog.net:8090/api/files/",
        "https://main--pms-api-proxy.netlify.app/media",
      );

    successWithBaseResponse(res, {
      url,
      fileName: `${image.name}.${image[raw === "true" ? "raw" : "image"]
        .split(".")
        .pop()}`,
    });
  }),
);

router.post(
  "/bulk-download",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { photos } = req.body;

    const { isInAlbum } = req.query;

    for (const photo of photos) {
      let image;
      if (isInAlbum === "true") {
        const dim = await pb.collection("photos_dimensions").getOne(photo);
        image = await pb.collection("photos_entries").getOne(dim.photo);
      } else {
        image = await pb.collection("photos_entries").getOne(photo);
      }

      const filePath = `${process.cwd()}/../database/pb_data/storage/${image.collectionId}/${image.id}/${image.image}`;

      fs.cpSync(
        filePath,
        `${process.cwd()}/../medium/${image.name}.${image.image.split(".").pop()}`,
      );
    }

    successWithBaseResponse(res);
  }),
);

router.get(
  "/dimensions/async-get",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { hideInAlbum } = req.query;

    res.status(202).json({
      state: "accepted",
    });

    if (allPhotosDimensions === undefined) {
      allPhotosDimensions = "pending";
      const filter = `is_deleted = false && is_locked = false ${hideInAlbum === "true" ? "&& is_in_album=false" : ""} `;
      let response = await pb
        .collection("photos_dimensions")
        .getList(1, 1, { filter })
        .catch();

      const collectionId =
        await pb.collection("photos_entries").collectionIdOrName;
      const { totalItems } = response ?? { totalItems: 0 };

      if (totalItems === 0) {
        allPhotosDimensions = {
          items: [],
          firstDayOfYear: null,
          firstDayOfMonth: null,
          totalItems: 0,
          collectionId,
        };
        return;
      }

      const photos = await pb.collection("photos_dimensions").getFullList({
        fields: "photo, width, height, shot_time",
        filter,
      });

      photos.forEach((photo) => {
        photo.id = photo.photo;
        photo.shot_time = moment(photo.shot_time).format("YYYY-MM-DD HH:mm:ss");
      });

      const groupByDate = Object.entries(
        photos.reduce((acc, photo) => {
          const date = photo.shot_time.split(" ")[0];
          if (acc[date]) {
            acc[date].push(photo);
          } else {
            acc[date] = [photo];
          }
          return acc;
        }, {}),
      );

      groupByDate.sort((a, b) => moment(b[0]).diff(moment(a[0])));

      const firstDayOfYear = {};
      const firstDayOfMonth = {};

      for (const [key] of groupByDate) {
        const date = moment(key);
        const year = date.year();
        if (!firstDayOfYear[year]) {
          firstDayOfYear[year] = date.format("YYYY-MM-DD");
        } else if (date.isBefore(moment(firstDayOfYear[year]))) {
          firstDayOfYear[year] = date.format("YYYY-MM-DD");
        }
      }

      for (const [key] of groupByDate) {
        const date = moment(key);
        const year = date.year();
        const month = date.month();
        if (month === moment(firstDayOfYear[year]).month()) {
          continue;
        }
        if (!firstDayOfMonth[`${year} -${month} `]) {
          firstDayOfMonth[`${year} -${month + 1} `] = date.format("YYYY-MM-DD");
        } else if (
          date.isBefore(moment(firstDayOfMonth[`${year} -${month} `]))
        ) {
          firstDayOfMonth[`${year} -${month + 1} `] = date.format("YYYY-MM-DD");
        }
      }

      allPhotosDimensions = {
        items: groupByDate,
        firstDayOfYear,
        firstDayOfMonth,
        totalItems,
        collectionId,
      };
    }
  }),
);

router.get(
  "/dimensions/async-res",
  asyncWrapper(async (req, res) => {
    if (allPhotosDimensions === "pending") {
      return res.status(202).json({
        state: "pending",
      });
    } else if (allPhotosDimensions !== undefined) {
      successWithBaseResponse(res, allPhotosDimensions);
      allPhotosDimensions = undefined;
    } else {
      res.status(404).json({
        state: "error",
        message: "No data available",
      });
    }
  }),
);

router.get(
  "/list",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { date } = req.query;

    if (!pb.authStore.isValid) {
      return res.status(401).json({
        state: "error",
        message: "Invalid authorization credentials",
      });
    }

    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        state: "error",
        message: "Invalid date format",
      });
    }

    const { hideInAlbum } = req.query;
    const filter = `is_deleted = false && is_locked = false && shot_time >= '${moment(
      date,
      "YYYY - MM - DD",
    )
      .startOf("day")
      .utc()
      .format("YYYY - MM - DD HH: mm:ss")}' && shot_time <= '${moment(
      date,
      "YYYY-MM-DD",
    )
      .endOf("day")
      .utc()
      .format(
        "YYYY-MM-DD HH:mm:ss",
      )} ' ${hideInAlbum === "true" ? ' && album = ""' : ""}`;

    let photos = await pb.collection("photos_dimensions").getFullList({
      filter,
      expand: "photo",
      fields:
        "expand.photo.raw,is_in_album,is_favourite,expand.photo.id,expand.photo.image,expand.photo.collectionId",
    });

    photos = photos.map((photo) => ({
      ...photo.expand.photo,
      is_in_album: photo.is_in_album,
      is_favourite: photo.is_favourite,
    }));

    photos.forEach((photo) => {
      photo.has_raw = photo.raw !== "";
      delete photo.raw;
    });

    successWithBaseResponse(res, photos);
  }),
);

router.get(
  "/list/:albumId",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { albumId } = req.params;

    if (!pb.authStore.isValid) {
      await pb
        .collection("_superusers")
        .authWithPassword(process.env.PB_EMAIL, process.env.PB_PASSWORD);

      const album = await pb.collection("photos_albums").getOne(albumId);

      if (!album.is_public) {
        res.status(401).json({
          state: "error",
          message: "Invalid authorization credentials",
        });
        return;
      }
    }

    let photos = await pb.collection("photos_dimensions").getFullList({
      filter: `photo.album = "${albumId}" && is_deleted = false && is_locked = false`,
      expand: "photo",
      fields:
        "expand.photo.id,expand.photo.image,expand,shot_time.photo.raw,width,height,id,expand.photo.collectionId",
      sort: "-shot_time",
    });

    photos = photos.map((photo) => ({
      width: photo.width,
      height: photo.height,
      ...photo.expand.photo,
      photoId: photo.expand.photo.id,
      id: photo.id,
      has_raw: photo.expand.photo.raw !== "",
      shot_time: photo.shot_time,
    }));

    photos.forEach((photo) => {
      delete photo.raw;
    });

    successWithBaseResponse(res, photos);
  }),
);

router.post(
  "/import",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const locked = req.query.locked === "true";

    if (progress !== null) {
      return clientError(res, "Another import is in progress", 409);
    }

    fs.readdirSync(`${process.cwd()}/../medium`)
      .filter((file) => file.startsWith("."))
      .forEach((file) => fs.unlinkSync(`${process.cwd()}/../medium/${file}`));

    const newFiles = fs
      .readdirSync(`${process.cwd()}/../medium`)
      .filter(
        (file) =>
          !file.startsWith(".") &&
          ((mime.lookup(file)
            ? mime.lookup(file).startsWith("image")
            : false) ||
            RAW_FILE_TYPE.includes(file.split(".").pop().toUpperCase())),
      );

    if (newFiles.length === 0) {
      return clientError(res, "No files to import", 400);
    }

    const distinctFiles = {};

    for (const file of newFiles) {
      const fileWithoutExtension = file.split(".").slice(0, -1).join(".");
      if (distinctFiles[fileWithoutExtension]) {
        distinctFiles[fileWithoutExtension].push(file);
      } else {
        distinctFiles[fileWithoutExtension] = [file];
      }
    }

    progress = {
      total: Object.keys(distinctFiles).length,
      done: 0,
    };

    res.status(202).json({
      state: "accepted",
    });

    for (const [key, value] of Object.entries(distinctFiles)) {
      const data = {
        name: key,
      };

      const rawFiles = value.filter((file) =>
        RAW_FILE_TYPE.includes(file.split(".").pop().toUpperCase()),
      );
      const imageFiles = value.filter(
        (file) =>
          !RAW_FILE_TYPE.includes(file.split(".").pop().toUpperCase()) &&
          (mime.lookup(file) ? mime.lookup(file).startsWith("image") : false),
      );

      if (imageFiles === 0) {
        progress.done++;
        continue;
      }

      if (imageFiles.length > 0) {
        const filePath = `${process.cwd()}/../medium/${imageFiles[0]}`;
        data.image = new File([fs.readFileSync(filePath)], imageFiles[0]);

        let tags;
        try {
          tags = await ExifReader.load(filePath);
        } catch {
          tags = {};
        }

        data.filesize = fs.statSync(filePath).size;
        if (tags.DateTimeOriginal) {
          data.shot_time = moment(
            tags.DateTimeOriginal.value,
            "YYYY:MM:DD HH:mm:ss",
          ).toISOString();
        } else {
          const dateStr = imageFiles[0]
            .toUpperCase()
            .match(/IMG-(?<date>\d+)-WA.+/)?.groups?.date;
          if (dateStr) {
            data.shot_time = moment(dateStr, "YYYYMMDD").format(
              "YYYY-MM-DD HH:mm:ss",
            );
          } else {
            data.shot_time = moment(
              fs.statSync(filePath).birthtime,
            ).toISOString();
          }
        }

        try {
          const size = await sizeOf(filePath);

          if ([6, 8].includes(tags.Orientation?.value)) {
            data.width = size.height;
            data.height = size.width;
          } else {
            data.width = size.width;
            data.height = size.height;
          }
        } catch {
          progress.done++;
          continue;
        }
      } else {
        progress.done++;
        continue;
      }

      if (rawFiles.length > 0) {
        data.raw = rawFiles.map((file) => {
          const buffer = fs.readFileSync(`${process.cwd()}/../medium/${file}`);
          return new File([buffer], file);
        })[0];
      }

      const newentries = await pb.collection("photos_entries").create(
        {
          image: data.image,
          ...(data.raw ? { raw: data.raw } : {}),
          name: data.name,
        },
        { $autoCancel: false },
      );

      await pb.collection("photos_dimensions").create({
        photo: newentries.id,
        width: data.width,
        height: data.height,
        shot_time: data.shot_time,
        is_locked: locked,
      });

      const thumbnailImageUrl = pb.files.getUrl(newentries, newentries.image, {
        thumb: "0x300",
      });

      try {
        await fetch(thumbnailImageUrl);
      } catch {}

      for (const file of [...rawFiles, ...imageFiles]) {
        fs.unlinkSync(`${process.cwd()}/../medium/${file}`);
      }

      progress.done++;
    }

    progress = null;
  }),
);

router.get(
  "/import/progress",
  asyncWrapper(async (req, res) => {
    successWithBaseResponse(res, progress === null ? "null" : progress);
  }),
);

router.delete(
  "/delete",
  asyncWrapper(async (req, res) => {
    const { pb } = req;
    const { photos } = req.body;
    const { isInAlbum } = req.query;

    for (const photo of photos) {
      let dim;
      if (isInAlbum === "true") {
        dim = await pb.collection("photos_dimensions").getOne(photo);
      } else {
        dim = await pb
          .collection("photos_dimensions")
          .getFirstListItem(`photo = "${photo}"`);
      }

      if (dim.is_in_album) {
        const { album } = await pb
          .collection("photos_entries")
          .getOne(dim.photo);
        await pb.collection("photos_albums").update(album, {
          "amount-": 1,
        });

        await pb.collection("photos_entries").update(dim.photo, {
          album: "",
        });
      }

      await pb.collection("photos_dimensions").update(dim.id, {
        is_deleted: true,
        is_in_album: false,
      });

      const albumCover = await pb
        .collection("photos_albums")
        .getFirstListItem(`cover = "${dim.photo}"`)
        .catch(() => null);

      if (albumCover) {
        await pb.collection("photos_albums").update(albumCover.id, {
          cover: "",
        });
      }
    }

    successWithBaseResponse(res);
  }),
);

export default router;
