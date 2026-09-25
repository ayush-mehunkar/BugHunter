const request = require("supertest");
const app = require("../server");

describe("Health API", () => {
  test("GET /api/health should return healthy response", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty("success", true);
  });
});
