import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Helper function to upload media buffer to Cloudinary (images and videos)
export const uploadToCloudinary = (buffer: Buffer, folder: string = 'horses', resourceType: 'image' | 'video' | 'auto' = 'auto'): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: folder,
      resource_type: resourceType,
    };

    // Apply different transformations based on resource type
    if (resourceType === 'image' || (resourceType === 'auto' && buffer.length < 10 * 1024 * 1024)) {
      // Image transformations
      uploadOptions.transformation = [
        { width: 800, height: 600, crop: 'fill', quality: 'auto' },
        { fetch_format: 'auto' }
      ];
    } else if (resourceType === 'video' || resourceType === 'auto') {
      // Video transformations - optimized for web
      uploadOptions.transformation = [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1280, height: 720, crop: 'limit' } // Limit max size but don't force aspect ratio
      ];
      // Set video-specific options
      uploadOptions.eager = [
        { width: 640, height: 480, crop: 'limit', format: 'mp4' },
        { width: 1280, height: 720, crop: 'limit', format: 'mp4' }
      ];
      uploadOptions.eager_async = true;
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
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