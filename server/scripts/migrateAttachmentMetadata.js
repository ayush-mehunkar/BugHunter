const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config();

const Bug = require("../models/Bug");

const BUG_ID = "6a9ff0a82e30023f973c62ce";

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB.");

    const bug = await Bug.collection.findOne({
      _id: new mongoose.Types.ObjectId(BUG_ID),
    });

    if (!bug) {
      console.log("Bug not found.");
      return;
    }

    console.log(`Bug found: ${bug.title}`);
    console.log(`Existing attachments: ${bug.attachments?.length || 0}`);

    if (!bug.attachments || bug.attachments.length === 0) {
      console.log("No attachment needs migration.");
      return;
    }

    const migratedAttachments = bug.attachments.map((attachment) => {
      if (typeof attachment !== "string") {
        return attachment;
      }

      const storedName = decodeURIComponent(
        attachment.split("/").pop() || ""
      );

      const filePath = path.join(
        __dirname,
        "../uploads",
        storedName
      );

      let size = 0;

      if (fs.existsSync(filePath)) {
        size = fs.statSync(filePath).size;
      } else {
        console.log(
          `Warning: physical file not found: ${storedName}`
        );
      }

      return {
        url: attachment,
        originalName: "test-attachment.txt",
        storedName,
        mimeType: "text/plain",
        size,
      };
    });

    await Bug.collection.updateOne(
      {
        _id: new mongoose.Types.ObjectId(BUG_ID),
      },
      {
        $set: {
          attachments: migratedAttachments,
        },
      }
    );

    console.log("Attachment migration completed.");
    console.log(
      JSON.stringify(migratedAttachments, null, 2)
    );
  } catch (error) {
    console.error(
      "Attachment migration failed:",
      error.message
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
