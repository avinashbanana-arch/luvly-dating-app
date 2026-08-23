const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Hold the file in memory, then stream it to Cloudinary — no need to
// write temp files to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB cap (covers short videos too)
});

function uploadBufferToCloudinary(buffer, folder, resourceType = "image") {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      reject(new Error("Photo uploads are not configured. Please contact support."));
      return;
    }
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return finish(reject, error);
        finish(resolve, result);
      }
    );
    const timeout = setTimeout(() => {
      stream.destroy(new Error("Photo upload timed out. Please try again."));
      finish(reject, new Error("Photo upload timed out. Please try again."));
    }, 55000);
    stream.end(buffer);
  });
}

module.exports = { upload, uploadBufferToCloudinary };
