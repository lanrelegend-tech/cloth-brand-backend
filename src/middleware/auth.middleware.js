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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.slice(7);

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Auth failed" });
  }
};