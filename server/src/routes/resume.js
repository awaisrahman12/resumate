import { Router } from "express";
import { generate, check, rewrite, history, downloadPDF } from "../controllers/resumeController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Every resume route is gated behind auth — no signed-in user, no access.
router.use(requireAuth);

router.post("/generate", generate);
router.post("/check", upload.single("resume"), check);
router.post("/rewrite", rewrite);
router.get("/history", history);
router.post("/download-pdf", downloadPDF);

export default router;
