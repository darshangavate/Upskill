import express from "express";
import { getDashboard, getAllUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", (req, res) => res.json({ message: "Hello from User" }));

router.get("/all", getAllUsers);           // ✅ /api/user/all
router.get("/:userId/dashboard", getDashboard);

export default router;
