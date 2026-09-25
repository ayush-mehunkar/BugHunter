import api from "./api";

// Create a test execution.
export const createTestExecution = async (
  executionData
) => {
  const response = await api.post(
    "/test-executions",
    executionData
  );

  return response.data;
};

// Get executions for a test case or bug.
export const getTestExecutions = async (
  testCaseId = null,
  defectBugId = null
) => {
  const params = {};

  if (testCaseId) {
    params.testCase = testCaseId;
  }

  if (defectBugId) {
    params.defectBug = defectBugId;
  }

  const response = await api.get(
    "/test-executions",
    {
      params,
    }
  );

  return response.data;
};

// Get one execution.
export const getTestExecutionById = async (
  executionId
) => {
  const response = await api.get(
    `/test-executions/${executionId}`
  );

  return response.data;
};

// Delete an execution.
export const deleteTestExecution = async (
  executionId
) => {
  const response = await api.delete(
    `/test-executions/${executionId}`
  );

  return response.data;
};
