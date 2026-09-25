require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const TestCase = require("../models/TestCase");
const Organization = require("../models/Organization");

const ORGANIZATION_SLUG = "bughunter-demo";

const migrateTestCases = async () => {
  try {
    await connectDB();

    console.log("Connected to MongoDB.");

    const organization = await Organization.findOne({
      slug: ORGANIZATION_SLUG,
    });

    if (!organization) {
      throw new Error(
        `Organization with slug "${ORGANIZATION_SLUG}" was not found.`
      );
    }

    const result = await TestCase.updateMany(
      {
        organization: null,
      },
      {
        $set: {
          organization: organization._id,
        },
      }
    );

    console.log(
      `Test cases assigned to organization: ${result.modifiedCount}`
    );

    const totalTestCases = await TestCase.countDocuments({
      organization: organization._id,
    });

    console.log("\nOrganization:");
    console.log({
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
    });

    console.log(
      `Total test cases in organization: ${totalTestCases}`
    );

    console.log(
      "\nTest case organization migration completed successfully."
    );
  } catch (error) {
    console.error(
      "Test case organization migration failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migrateTestCases();
