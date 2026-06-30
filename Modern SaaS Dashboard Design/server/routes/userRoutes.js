import express from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("Admin"));

router.route("/")
  .get(getUsers)
  .post(createUser);

router.route("/:id")
  .patch(updateUser)
  .delete(deleteUser);

export default router;
