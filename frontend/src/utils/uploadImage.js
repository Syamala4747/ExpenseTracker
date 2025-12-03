import { API_PATHS } from './apiPaths';
import axiosInstance from './axiosInstance';

const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("photo", imageFile); // ✅ MUST match backend multer field

  try {
   const response = await axiosInstance.post(
      API_PATHS.IMAGE.UPLOAD_IMAGE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // ensure uploads have enough time
        timeout: 30000,
      }
    );

    return response.data; // Should return { imageUrl: "https://..." }
  } catch (error) {
    console.error('Error uploading the image:', error?.message || error);
    if (error?.response) {
      console.error('Upload response data:', error.response.data);
      console.error('Upload response status:', error.response.status);
    }
    throw error;
  }
};

export default uploadImage;
