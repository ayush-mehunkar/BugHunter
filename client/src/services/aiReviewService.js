import api from "./api";

export const getAIReview = async (bugId) => {
  const response = await api.get(
    `/ai-reviews/${bugId}`
  );

  return response.data;
};

export const submitAIReview = async (
  bugId,
  reviewData
) => {
  const response = await api.post(
    `/ai-reviews/${bugId}`,
    reviewData
  );

  return response.data;
};
