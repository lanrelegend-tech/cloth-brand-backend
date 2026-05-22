import { verifyToken } from "../services/auth.service.js";

export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  req.admin = decoded;
  next();
};