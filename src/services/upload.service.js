import { supabase } from "../config/supabase.js";

export const uploadImage = async (file) => {
  const fileName = `${Date.now()}-${file.originalname}`;

  const { data, error } = await supabase.storage
    .from("products-images")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw error;

  const { data: publicUrl } = supabase.storage
    .from("products-images")
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
};