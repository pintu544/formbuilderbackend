import { v2 as cloudinary } from "cloudinary";

export const connectCloudinary = () =>
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
  });

export const getPublicIdFromUrl = (url) =>
  url?.match(/upload\/(?:v\d+\/)?([^\.]+)/)[1];
