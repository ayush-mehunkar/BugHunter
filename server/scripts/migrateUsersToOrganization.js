require("dotenv").config();

const mongoose = require("mongoose");

const User = require("../models/User");
const Organization = require("../models/Organization");

const connectDB = require("../config/db");

const ORGANIZATION_NAME = "BugHunter Demo Organization";
const ORGANIZATION_SLUG = "bughunter-demo";

const migrateUsers = async () => {
  try {
    await connectDB();

    console.log("Connected to MongoDB.");

    // Find existing organization if the script has already
    // been run. This makes the migration safe to run again.
    let organization = await Organization.findOne({
      slug: ORGANIZATION_SLUG,
    });

    if (!organization) {
      const firstAdmin = await User.findOne({
        role: "admin",
      }).sort({ createdAt: 1 });

      const firstUser = await User.findOne().sort({
        createdAt: 1,
      });

      const owner = firstAdmin || firstUser;

      organization = await Organization.create({
        name: ORGANIZATION_NAME,
        slug: ORGANIZATION_SLUG,
        owner: owner?._id || null,
        plan: "free",
        status: "active",
      });

      console.log(
        `Created organization: ${organization.name}`
      );
    } else {
      console.log(
        `Organization already exists: ${organization.name}`
      );
    }

    const result = await User.updateMany(
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
      `Users assigned to organization: ${result.modifiedCount}`
    );

    const users = await User.find({
      organization: organization._id,
    }).select(
      "_id name email role organization"
    );

    console.log("\nOrganization:");
    console.log({
      id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
      plan: organization.plan,
      status: organization.status,
    });

    console.log("\nUsers in organization:");

    users.forEach((user) => {
      console.log({
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization.toString(),
      });
    });

    console.log(
      "\nOrganization migration completed successfully."
    );
  } catch (error) {
    console.error(
      "Organization migration failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migrateUsers();
