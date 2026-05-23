import { verifyToken } from "../services/auth.service.js";

export const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.slice(7);

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth failed" });
  }
};

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token missing" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!decoded.id) {
      return res.status(401).json({ error: "Token payload missing user id" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ error: "Auth failed" });
  }
};