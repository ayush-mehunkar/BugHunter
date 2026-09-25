import api from "./api";

// Get all test cases with optional filters.
export const getTestCases = async (params = {}) => {
  const response = await api.get("/test-cases", {
    params,
  });

  return response.data;
};

// Get one test case.
export const getTestCaseById = async (id) => {
  const response = await api.get(
    `/test-cases/${id}`
  );

  return response.data;
};

// Create a test case.
export const createTestCase = async (testCaseData) => {
  const response = await api.post(
    "/test-cases",
    testCaseData
  );

  return response.data;
};

// Update a test case.
export const updateTestCase = async (
  id,
  testCaseData
) => {
  const response = await api.put(
    `/test-cases/${id}`,
    testCaseData
  );

  return response.data;
};

// Delete a test case.
export const deleteTestCase = async (id) => {
  const response = await api.delete(
    `/test-cases/${id}`
  );

  return response.data;
};
