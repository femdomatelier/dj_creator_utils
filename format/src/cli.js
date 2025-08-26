#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");
const fs = require("fs");
const DLsiteTool = require("./dlsite-tool");
const GiveawayNotificationTool = require("./giveaway-notification");

const program = new Command();

program
  .name("format-tools")
  .description("Template-based file generation tools")
  .version("1.0.0");

program
  .command("dlsite")
  .description("Generate DLsite product files from JSON data and template")
  .argument("<input-json>", "Input JSON file with product data")
  .argument("<template-name>", "Template name (without .txt extension)")
  .option("-o, --output <path>", "Output file path (default: auto-generated)")
  .action(async (inputJson, templateName, options) => {
    try {
      const tool = new DLsiteTool();
      await tool.generate(inputJson, templateName, options.output);
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

program
  .command("giveaway")
  .description(
    "Generate giveaway notification files from winners JSON and serials CSV",
  )
  .argument("<winners-json>", "Winners JSON file from giveaway project")
  .argument("<serials-csv>", "CSV file with serial numbers")
  .argument("<template-name>", "Template name (without .txt extension)")
  .option(
    "-o, --output-dir <path>",
    "Output directory (default: ./notifications)",
  )
  .action(async (winnersJson, serialsCsv, templateName, options) => {
    try {
      const tool = new GiveawayNotificationTool();
      await tool.generate(
        winnersJson,
        serialsCsv,
        templateName,
        options.outputDir,
      );
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  });

program
  .command("list-templates")
  .description("List available example templates")
  .action(async () => {
    try {
      const examplesDir = path.join(__dirname, "../examples");
      if (!fs.existsSync(examplesDir)) {
        console.log("No examples directory found");
        return;
      }

      const files = fs
        .readdirSync(examplesDir)
        .filter((f) => f.endsWith(".txt"));
      if (files.length === 0) {
        console.log("No template examples found");
        return;
      }

      console.log("Available example templates:");
      files.forEach((file) => {
        const name = path.basename(file, ".txt");
        console.log(`  ${name}`);
      });
    } catch (error) {
      console.error("Error listing templates:", error.message);
      process.exit(1);
    }
  });

program.parse();
