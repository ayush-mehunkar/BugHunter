import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api";

// Build authentication headers for attachment requests.
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

// Get all attachments for a bug.
export const getAttachments = async (bugId) => {
  const response = await axios.get(
    `${API_BASE_URL}/bugs/${bugId}/attachments`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// Upload one or more attachments to a bug.
export const uploadAttachments = async (
  bugId,
  files,
  onUploadProgress
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("attachments", file);
  });

  const response = await axios.post(
    `${API_BASE_URL}/bugs/${bugId}/attachments`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    }
  );

  return response.data;
};

// Delete a specific attachment from a bug.
export const deleteAttachment = async (
  bugId,
  attachmentId
) => {
  const response = await axios.delete(
    `${API_BASE_URL}/bugs/${bugId}/attachments/${attachmentId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};
