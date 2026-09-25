import api from "./api";

export const createInvitation = async (email, role) => {
  const response = await api.post("/invitations", {
    email,
    role,
  });

  return response.data;
};

export const getInvitations = async () => {
  const response = await api.get("/invitations");

  return response.data;
};

export const cancelInvitation = async (invitationId) => {
  const response = await api.delete(
    `/invitations/${invitationId}`
  );

  return response.data;
};

export const validateInvitation = async (token) => {
  const response = await api.get(
    `/invitations/validate/${token}`
  );

  return response.data;
};

export const acceptInvitation = async (
  token,
  name,
  password
) => {
  const response = await api.post("/invitations/accept", {
    token,
    name,
    password,
  });

  return response.data;
};
