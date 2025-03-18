import express from "express";
import entriesRoutes from "./routes/entries.routes";
import subjectRoutes from "./routes/subjects.routes";
import workspaceRoutes from "./routes/workspaces.routes";

const router = express.Router();

router.use("/workspace", workspaceRoutes);
router.use("/subject", subjectRoutes);
router.use("/entries", entriesRoutes);

export default router;
