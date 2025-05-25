import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcorxaflu',
  api_key: process.env.CLOUDINARY_API_KEY || '126878585478337',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mh1U7Vv4hgwh1LDGBXnQPqDYS8s',
});

export { cloudinary };

// Helper function to upload image buffer to Cloudinary
export const uploadToCloudinary = (buffer: Buffer, folder: string = 'horse-photos'): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
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