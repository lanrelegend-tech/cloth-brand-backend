import { verifyToken } from "../services/auth.service.js";
import { supabase } from "../config/supabase.js";

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7);
};

const isConfiguredAdminEmail = (email) => (
  Boolean(email && process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL)
);

const getUserRole = async (decoded) => {
  if (!decoded?.id && !decoded?.email) return null;

  let query = supabase.from("users").select("id, email, role").limit(1);

  if (decoded.id) {
    query = query.eq("id", decoded.id);
  } else {
    query = query.eq("email", decoded.email);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("ADMIN ROLE LOOKUP ERROR:", error);
    return null;
  }

  return data?.role || null;
};

export const requireAdmin = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const isAdmin =
      decoded.role === "admin" ||
      isConfiguredAdminEmail(decoded.email) ||
      (await getUserRole(decoded)) === "admin";

    if (!isAdmin) {
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
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "Token missing" });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!decoded.id && decoded.role !== "admin") {
      return res.status(401).json({ error: "Token payload missing user id" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ error: "Auth failed" });
  }
};
