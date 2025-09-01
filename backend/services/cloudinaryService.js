const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  constructor() {
    this.folder = process.env.CLOUDINARY_FOLDER || "ngr-test";
  }

  /**
   * Upload file to Cloudinary
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalFilename - Original filename
   * @param {string} contentType - File content type
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(fileBuffer, originalFilename, contentType) {
    try {
      // Generate unique filename
      const fileExtension = originalFilename.split(".").pop();
      const uniqueFilename = `${this.folder}/${Date.now()}-${uuidv4()}`;

      // Convert buffer to base64 for Cloudinary
      const base64Data = fileBuffer.toString("base64");
      const dataURI = `data:${contentType};base64,${base64Data}`;

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        public_id: uniqueFilename,
        folder: this.folder,
        resource_type: "auto",
        transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
      });

      console.log(`✅ File uploaded successfully: ${uploadResult.secure_url}`);

      return {
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        size: fileBuffer.length,
        contentType: contentType,
        width: uploadResult.width,
        height: uploadResult.height,
      };
    } catch (error) {
      console.error("❌ Cloudinary Upload Error:", error);
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === "ok") {
        console.log(`✅ File deleted successfully: ${publicId}`);
        return {
          success: true,
          message: "File deleted successfully",
        };
      } else {
        throw new Error("Failed to delete file");
      }
    } catch (error) {
      console.error("❌ Cloudinary Delete Error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage stats
   */
  async getStorageStats() {
    try {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: this.folder,
        max_results: 1000,
      });

      const totalSize = result.resources.reduce((sum, resource) => sum + resource.bytes, 0);
      const totalFiles = result.resources.length;

      return {
        success: true,
        stats: {
          totalFiles,
          totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        },
      };
    } catch (error) {
      console.error("❌ Error getting storage stats:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
const cloudinaryService = new CloudinaryService();
module.exports = cloudinaryService;
