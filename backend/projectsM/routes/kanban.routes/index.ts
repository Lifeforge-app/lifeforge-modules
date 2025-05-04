import express from "express";
import columnsRoutes from "./routes/columns.routes";

const router = express.Router();

router.use("/columns", columnsRoutes);
router.use("/entries", columnsRoutes);

export default router;
