import { Router } from "express";
import { addToHistory, getUserHistory, login, register, logout, getUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";



const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/logout").post(logout)
router.route("/me").get(authMiddleware, getUser)
router.route("/add_to_activity").post(authMiddleware, addToHistory)
router.route("/get_all_activity").get(authMiddleware, getUserHistory)

export default router;