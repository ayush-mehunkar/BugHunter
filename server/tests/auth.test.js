jest.mock("../models/User", () => ({
  findOne: jest.fn(),
}));

const request = require("supertest");
const express = require("express");
const { loginUser } = require("../controllers/authController");
const User = require("../models/User");

const app = express();

app.use(express.json());

app.post("/api/auth/login", loginUser);

describe("Authentication API", () => {
  test("POST /api/auth/login should reject missing email and password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Email and password are required"
    );
  });

  test("POST /api/auth/login should reject invalid credentials", async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "invalid-user@bughunter.com",
        password: "wrong-password",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Invalid email or password"
    );

    expect(User.findOne).toHaveBeenCalledWith({
      email: "invalid-user@bughunter.com",
    });
  });
});
