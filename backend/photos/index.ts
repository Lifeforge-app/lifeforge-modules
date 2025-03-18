import express from "express";
import albumTagRoute from "./routes/album-tags.js";
import albumRoute from "./routes/albums.js";
import entriesRoute from "./routes/entries.js";
import favouritesRoute from "./routes/favourites.js";
import lockedRoute from "./routes/locked.js";
import trashRoute from "./routes/trash.js";

const router = express.Router();

router.use("/entries", entriesRoute);
router.use("/album", albumRoute);
router.use("/album/tag", albumTagRoute);
router.use("/favourites", favouritesRoute);
router.use("/locked", lockedRoute);
router.use("/trash", trashRoute);

export default router;
