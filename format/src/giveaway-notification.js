const TemplateEngine = require("./template-engine");
const FileProcessor = require("./utils/file-processor");
const path = require("path");

class GiveawayNotificationTool {
  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  async generate(winnersJsonPath, serialsCsvPath, templateName, outputDir) {
    try {
      console.log("Reading winners JSON...");
      const winnersData = await FileProcessor.readJsonFile(winnersJsonPath);

      console.log("Reading serials CSV...");
      const serialsData = await FileProcessor.readCsvFile(serialsCsvPath);

      console.log("Processing and matching data...");
      const matchedData = await this.matchWinnersWithSerials(
        winnersData,
        serialsData,
      );

      const finalOutputDir =
        outputDir || path.join(process.cwd(), "output", "notifications");
      await FileProcessor.ensureDirectory(finalOutputDir);

      console.log("Generating notification files...");
      const generatedFiles = await this.generateNotificationFiles(
        matchedData,
        templateName,
        finalOutputDir,
      );

      console.log(
        `✅ Successfully generated ${generatedFiles.length} notification files`,
      );
      console.log(`📁 Output directory: ${finalOutputDir}`);
      generatedFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${path.basename(file)}`);
      });

      return {
        outputDir: finalOutputDir,
        files: generatedFiles,
        totalGenerated: generatedFiles.length,
      };
    } catch (error) {
      console.error("❌ Giveaway notification tool error:", error.message);
      throw error;
    }
  }

  async matchWinnersWithSerials(winnersData, serialsData) {
    const winners = this.extractWinners(winnersData);
    const serials = serialsData.data;

    if (winners.length === 0) {
      throw new Error("No winners found in the JSON data");
    }

    if (serials.length === 0) {
      throw new Error("No serials found in the CSV data");
    }

    console.log(
      `Found ${winners.length} winners and ${serials.length} serials`,
    );

    if (winners.length > serials.length) {
      console.warn(
        `⚠️  Warning: More winners (${winners.length}) than available serials (${serials.length})`,
      );
    }

    const matched = [];
    const availableSerials = [...serials];

    for (let i = 0; i < winners.length && i < availableSerials.length; i++) {
      const winner = winners[i];
      const serial = availableSerials[i];

      matched.push({
        ...winner,
        serial: serial,
        serialNumber:
          serial.serial ||
          serial.Serial ||
          serial.serialNumber ||
          Object.values(serial)[0],
        matchIndex: i + 1,
        totalWinners: Math.min(winners.length, serials.length),
        csvHeaders: serialsData.headers,
      });
    }

    return matched;
  }

  extractWinners(winnersData) {
    if (Array.isArray(winnersData.winners)) {
      return winnersData.winners.map((winner, index) => ({
        username: winner.username || winner,
        rank: winner.rank || index + 1,
        types: winner.types || [],
        ...winner,
      }));
    }

    if (Array.isArray(winnersData)) {
      return winnersData.map((winner, index) => ({
        username: winner.username || winner,
        rank: winner.rank || index + 1,
        types: winner.types || [],
        ...winner,
      }));
    }

    throw new Error("Cannot extract winners from the provided data structure");
  }

  async generateNotificationFiles(matchedData, templateName, outputDir) {
    const generatedFiles = [];

    for (const winnerData of matchedData) {
      try {
        const processedData = this.processWinnerData(winnerData);

        const renderedContent = await this.templateEngine.renderFromTemplate(
          templateName,
          processedData,
        );

        const fileName = this.generateNotificationFileName(winnerData);
        const filePath = path.join(outputDir, fileName);

        const writtenPath = await FileProcessor.writeFile(
          filePath,
          renderedContent,
        );
        generatedFiles.push(writtenPath);

        console.log(`  Generated: ${fileName}`);
      } catch (error) {
        console.error(
          `❌ Failed to generate notification for ${winnerData.username}: ${error.message}`,
        );
        continue;
      }
    }

    return generatedFiles;
  }

  processWinnerData(winnerData) {
    const processed = {};

    const currentDate = new Date();
    processed.now = this.formatDateJapanese(currentDate);
    processed.nowISO = currentDate.toISOString().split("T")[0];
    processed.nowTime = currentDate.toISOString().replace("T", " ").slice(0, 19);

    processed.username = winnerData.username;
    processed.serialNumber = winnerData.serialNumber || "N/A";

    return processed;
  }

  formatDateJapanese(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
  }

  generateNotificationFileName(winnerData) {
    const safeUsername = (winnerData.username || "winner")
      .replace(/[@#]/g, "")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const rank = winnerData.rank || 1;
    return `notification_${rank}_${safeUsername}.txt`;
  }

  async validateTemplate(templateName, sampleWinnerData) {
    try {
      const template = await this.templateEngine.loadTemplate(templateName);
      const processedData = this.processWinnerData(sampleWinnerData);
      return this.templateEngine.validateVariables(template, processedData);
    } catch (error) {
      throw new Error(`Template validation failed: ${error.message}`);
    }
  }

  async getTemplateInfo(templateName) {
    try {
      const variables =
        await this.templateEngine.getTemplateVariables(templateName);
      return {
        templateName,
        requiredVariables: variables,
        description: `Giveaway notification template requiring: ${variables.join(", ")}`,
      };
    } catch (error) {
      throw new Error(`Failed to get template info: ${error.message}`);
    }
  }
}

module.exports = GiveawayNotificationTool;
