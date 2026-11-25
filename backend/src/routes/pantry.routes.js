import { Router } from "express";
import { uploadSingleImage } from "../middlewares/upload.middleware.js";
import {
  handleScanUpload,
  handleUpdateScan,
  handleDeleteScan,
  handleBatchDeleteScans
} from "../controllers/scan.controller.js";
import {
  handleHealth,
  handleCompare,
  handleGetPredictions,
  handleGetShoppingList
} from "../controllers/pantry.controller.js";

const router = Router();

router.get("/health", handleHealth);
router.post("/scan", uploadSingleImage, handleScanUpload);
router.put("/scans/:id", handleUpdateScan);
router.delete("/scans/:id", handleDeleteScan);
router.post("/scans/delete-batch", handleBatchDeleteScans);
router.post("/compare", handleCompare);
router.get("/predictions", handleGetPredictions);
router.get("/shopping-list", handleGetShoppingList);

export default router;
