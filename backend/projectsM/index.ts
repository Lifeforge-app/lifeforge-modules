import express from "express";
import categoryRoutes from "./routes/categories.routes";
import entriesRoutes from "./routes/entries.routes";
import kanbanRoutes from "./routes/kanban.routes";
import statusRoutes from "./routes/statuses.routes";
import technologyRoutes from "./routes/technologies.routes";
import visibilityRoutes from "./routes/visibilities.routes";

const router = express.Router();

router.use("/entries", entriesRoutes);
router.use("/kanban", kanbanRoutes);
router.use("/categories", categoryRoutes);
router.use("/statuses", statusRoutes);
router.use("/visibilities", visibilityRoutes);
router.use("/technologies", technologyRoutes);

export default router;
