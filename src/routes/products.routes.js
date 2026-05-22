import express from "express";
import { supabase } from "../config/supabase.js";
import { upload } from "../middleware/upload.middleware.js";
import { uploadImage } from "../services/upload.service.js";

const router = express.Router();

//
// GET ALL PRODUCTS
//
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error });

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

  if (error) return res.status(400).json({ error });

  res.json(data);
});

//
// CREATE PRODUCT
//
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImage(file);
        imageUrls.push(url);
      }
    }

    const productData = {
      name: req.body.name || "",
      description: req.body.description || "",
      price: Number(req.body.price || 0),
      category: req.body.category || "",
      sku: req.body.sku || "",
      stock: Number(req.body.stock || 0),

      size: req.body.size ? JSON.parse(req.body.size) : [],
      color: req.body.color ? JSON.parse(req.body.color) : [],
      images: imageUrls || [],
    };

    if (!productData.name || !productData.price) {
      return res.status(400).json({
        error: "name and price are required",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select();

    if (error) return res.status(400).json({ error });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// UPDATE PRODUCT
//
router.patch("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("products")
    .update(req.body)
    .eq("id", id)
    .select();

  if (error) return res.status(400).json({ error });

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

  if (error) return res.status(400).json({ error });

  res.json({
    message: "Product deleted successfully",
    data,
  });
});

export default router;