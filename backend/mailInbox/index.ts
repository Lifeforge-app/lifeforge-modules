import express from "express";
import entriesRoutes from "./routes/entries.routes";
import labelsRoutes from "./routes/labels.routes";

const router = express.Router();

router.use("/entries", entriesRoutes);
router.use("/labels", labelsRoutes);

export default router;
