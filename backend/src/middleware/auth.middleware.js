import { User } from "../models/user.model.js";
import httpStatus from "http-status";

export const authMiddleware = async (req, res, next) => {
    let token = req.cookies.token;

    // Check for token in Authorization header if not found in cookies
    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1]; // Format: "Bearer <token>"
    }

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Unauthorized: Invalid token" });
        }

        req.user = user;
        next();
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
};
