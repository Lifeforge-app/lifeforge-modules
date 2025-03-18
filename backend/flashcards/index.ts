import express from "express";
import cardRoutes from "./routes/card.routes";
import deckRoutes from "./routes/deck.routes";
import tagRoutes from "./routes/tag.routes";

const router = express.Router();

router.use("/tag", tagRoutes);
router.use("/deck", deckRoutes);
router.use("/card", cardRoutes);

export default router;
