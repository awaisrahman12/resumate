import { Router } from "express";
import {
  signup,
  login,
  me,
  verifyOtpCode,
  resendOtp,
  googleAuth,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtpCode);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", requireAuth, me);

export default router;
