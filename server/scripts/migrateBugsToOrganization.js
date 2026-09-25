require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Bug = require("../models/Bug");
const Organization = require("../models/Organization");

const ORGANIZATION_SLUG = "bughunter-demo";

const migrateBugs = async () => {
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

    const result = await Bug.updateMany(
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
      `Bugs assigned to organization: ${result.modifiedCount}`
    );

    const totalBugs = await Bug.countDocuments({
      organization: organization._id,
    });

    console.log("\nOrganization:");
    console.log({
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
    });

    console.log(`Total bugs in organization: ${totalBugs}`);

    console.log(
      "\nBug organization migration completed successfully."
    );
  } catch (error) {
    console.error(
      "Bug organization migration failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migrateBugs();
