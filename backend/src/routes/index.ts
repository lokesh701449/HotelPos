import { Router } from "express";
import authRouter from "./auth.routes";
import categoryRouter from "./category.routes";
import menuRouter from "./menu.routes";
import tableRouter from "./table.routes";
import orderRouter from "./order.routes";
import kitchenRouter from "./kitchen.routes";
import paymentRouter from "./payment.routes";
import dashboardRouter from "./dashboard.routes";
import userRouter from "./user.routes";

const apiRouter = Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "healthy", timestamp: new Date() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/menu-items", menuRouter);
apiRouter.use("/tables", tableRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/kitchen", kitchenRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/users", userRouter);

export default apiRouter;
