const { getBugById } = require("../controllers/bugController");
const Bug = require("../models/Bug");

jest.mock("../models/Bug");

describe("Multi-Tenant Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Organization B cannot access a bug belonging to Organization A", async () => {
    const organizationA = "6aa0c930928ba2870fca9ddf";
    const organizationB = "6aa131895ab7f9cf680cfac1";
    const bugId = "6a9bc42cd6e9ce4c7ae4400f";

    Bug.findOne.mockResolvedValue(null);

    const req = {
      params: {
        id: bugId,
      },
      user: {
        organizationId: organizationB,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getBugById(req, res);

    expect(Bug.findOne).toHaveBeenCalledWith({
      _id: bugId,
      organization: organizationB,
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Bug not found",
    });

    expect(Bug.findOne).not.toHaveBeenCalledWith({
      _id: bugId,
      organization: organizationA,
    });
  });

  test("request without organization is rejected", async () => {
    const req = {
      params: {
        id: "6a9bc42cd6e9ce4c7ae4400f",
      },
      user: {},
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await getBugById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(Bug.findOne).not.toHaveBeenCalled();
  });
});
