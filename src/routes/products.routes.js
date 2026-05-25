import express from "express";
import { supabase } from "../config/supabase.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

const PRODUCT_FIELDS = [
  "name",
  "description",
  "price",
  "category",
  "sku",
  "stock",
  "size",
  "color",
  "images",
];

const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall back to comma-separated form values below.
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getPublicUploadUrl = (req, filename) => (
  `${req.protocol}://${req.get("host")}/uploads/${filename}`
);

const formatSupabaseError = (error) => ({
  error: error?.message || "Database request failed",
  details: error?.details,
});

const buildProductPayload = (body, images = []) => ({
  name: body.name || "",
  description: body.description || "",
  price: Number(body.price || 0),
  category: body.category || "",
  sku: body.sku || "",
  stock: Number(body.stock || 0),
  size: parseListField(body.size),
  color: parseListField(body.color),
  images,
});

const buildProductUpdate = (body) => (
  PRODUCT_FIELDS.reduce((payload, field) => {
    if (body[field] === undefined) return payload;

    if (field === "price" || field === "stock") {
      payload[field] = Number(body[field] || 0);
      return payload;
    }

    if (field === "size" || field === "color") {
      payload[field] = parseListField(body[field]);
      return payload;
    }

    payload[field] = body[field];
    return payload;
  }, {})
);

//
// GET ALL PRODUCTS
//
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json(formatSupabaseError(error));

  res.json(data);
});

//
// GET SINGLE PRODUCT
//
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json(formatSupabaseError(error));

  res.json(data);
});

//
// CREATE PRODUCT
//
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const imageUrls = [];

    if (req.files?.length > 0) {
      for (const file of req.files) {
        imageUrls.push(getPublicUploadUrl(req, file.filename));
      }
    }

    const productData = buildProductPayload(req.body, imageUrls);

    if (!productData.name || !productData.price) {
      return res.status(400).json({
        error: "name and price are required",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select();

    if (error) return res.status(400).json(formatSupabaseError(error));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// UPLOAD SINGLE IMAGE
//
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    return res.json({
      url: getPublicUploadUrl(req, req.file.filename),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

//
// UPDATE PRODUCT
//
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = buildProductUpdate(req.body);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid product fields provided" });
  }

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) return res.status(400).json(formatSupabaseError(error));

  res.json(data);
});

//
// DELETE PRODUCT
//
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select();

  if (error) return res.status(400).json(formatSupabaseError(error));

  res.json({
    message: "Product deleted successfully",
    data,
  });
});

export default router;
