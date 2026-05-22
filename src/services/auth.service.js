import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;

// simple admin check (you can later move to DB)
export const loginAdmin = async (email, password) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email !== adminEmail || password !== adminPassword) {
    return null;
  }

  const token = jwt.sign(
    { role: "admin", email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return token;
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};