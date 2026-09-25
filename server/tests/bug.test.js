const request = require("supertest");
const express = require("express");
const { createBug } = require("../controllers/bugController");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  req.user = {
    userId: "6aa131a7964223b6bab709c2",
    organizationId: "6aa0c930928ba2870fca9ddf",
  };

  next();
});

app.post("/api/bugs", createBug);

describe("Bug API", () => {
  test("POST /api/bugs should reject missing required fields", async () => {
    const response = await request(app)
      .post("/api/bugs")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Title, description, and project are required"
    );
  });

  test("POST /api/bugs should reject invalid priority", async () => {
    const response = await request(app)
      .post("/api/bugs")
      .send({
        title: "Test bug",
        description: "Test bug description",
        project: "Test Project",
        priority: "Urgent",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Invalid priority value"
    );
  });

  test("POST /api/bugs should reject invalid severity", async () => {
    const response = await request(app)
      .post("/api/bugs")
      .send({
        title: "Test bug",
        description: "Test bug description",
        project: "Test Project",
        severity: "Urgent",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "Invalid severity value"
    );
  });


});
