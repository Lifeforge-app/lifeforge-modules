import express from "express";
import flightsRoutes from "./routes/flights.routes";

const router = express.Router();

router.use("/flights", flightsRoutes);

export default router;
