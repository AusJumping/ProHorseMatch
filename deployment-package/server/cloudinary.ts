import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Helper function to upload image buffer to Cloudinary
export const uploadToCloudinary = (buffer: Buffer, folder: string = 'horses'): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'fill', quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Helper function to delete image from Cloudinary
export const deleteFromCloudinary = (publicId: string): Promise<any> => {
  return cloudinary.uploader.destroy(publicId);
};