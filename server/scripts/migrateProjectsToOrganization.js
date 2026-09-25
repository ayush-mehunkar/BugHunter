require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Project = require("../models/Project");
const Organization = require("../models/Organization");

const ORGANIZATION_SLUG = "bughunter-demo";

const migrateProjects = async () => {
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

    const result = await Project.updateMany(
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
      `Projects assigned to organization: ${result.modifiedCount}`
    );

    const totalProjects = await Project.countDocuments({
      organization: organization._id,
    });

    console.log("\nOrganization:");
    console.log({
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
    });

    console.log(
      `Total projects in organization: ${totalProjects}`
    );

    console.log(
      "\nProject organization migration completed successfully."
    );
  } catch (error) {
    console.error(
      "Project organization migration failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migrateProjects();
