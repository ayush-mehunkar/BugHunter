require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const TestExecution = require("../models/TestExecution");
const Organization = require("../models/Organization");

const ORGANIZATION_SLUG = "bughunter-demo";

const migrateTestExecutions = async () => {
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

    const result = await TestExecution.updateMany(
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
      `Test executions assigned to organization: ${result.modifiedCount}`
    );

    const totalExecutions =
      await TestExecution.countDocuments({
        organization: organization._id,
      });

    console.log("\nOrganization:");
    console.log({
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
    });

    console.log(
      `Total test executions in organization: ${totalExecutions}`
    );

    console.log(
      "\nTest execution organization migration completed successfully."
    );
  } catch (error) {
    console.error(
      "Test execution organization migration failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migrateTestExecutions();
