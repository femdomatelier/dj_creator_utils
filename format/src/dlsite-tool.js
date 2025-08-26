const TemplateEngine = require("./template-engine");
const DateCalculator = require("./utils/date-calculator");
const PriceCalculator = require("./utils/price-calculator");
const FileProcessor = require("./utils/file-processor");
const path = require("path");

class DLsiteTool {
  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  async generate(inputJsonPath, templateName, outputPath) {
    try {
      console.log("Reading input JSON...");
      const inputData = await FileProcessor.readJsonFile(inputJsonPath);

      console.log("Processing data...");
      const processedData = await this.processData(inputData);

      console.log("Rendering template...");
      const renderedContent = await this.templateEngine.renderFromTemplate(
        templateName,
        processedData,
      );

      const finalOutputPath =
        outputPath || this.generateDefaultOutputPath(inputData, templateName);

      console.log("Writing output file...");
      const writtenPath = await FileProcessor.writeFile(
        finalOutputPath,
        renderedContent,
      );

      console.log(`✅ Successfully generated: ${writtenPath}`);
      console.log(`📊 Template: ${templateName}`);
      console.log(`📁 Input: ${inputJsonPath}`);

      return writtenPath;
    } catch (error) {
      console.error("❌ DLsite tool error:", error.message);
      throw error;
    }
  }

  async processData(inputData) {
    const processed = { ...inputData };

    if (inputData.releaseDate) {
      processed.date = DateCalculator.formatDate(
        inputData.releaseDate,
        "YYYY年MM月DD日",
      );
      processed.dateISO = DateCalculator.formatDate(
        inputData.releaseDate,
        "YYYY-MM-DD",
      );
      processed.dateMD = DateCalculator.formatDate(
        inputData.releaseDate,
        "MM/DD",
      );
      processed.weekday = DateCalculator.getWeekday(
        inputData.releaseDate,
        "ja",
      );
      processed.weekdayEN = DateCalculator.getWeekday(
        inputData.releaseDate,
        "en",
      );
      processed.dateNoYear = DateCalculator.formatDate(
        inputData.releaseDate,
        "MM月DD日",
      );
      processed.dateNoYearEN = DateCalculator.formatDate(
        inputData.releaseDate,
        "MMM DD",
      );
    }

    if (inputData.originalPrice !== undefined) {
      processed.price = PriceCalculator.formatPrice(
        inputData.originalPrice,
        "JPY",
      );
    }

    if (
      inputData.originalPrice !== undefined &&
      inputData.discountPercentage !== undefined
    ) {
      const priceCalc = PriceCalculator.calculateDiscountedPrice(
        inputData.originalPrice,
        inputData.discountPercentage,
      );

      processed.salePrice = PriceCalculator.formatPrice(
        priceCalc.finalPrice,
        "JPY",
      );
      processed.savings = PriceCalculator.formatPrice(priceCalc.savings, "JPY");
      processed.off = inputData.discountPercentage;
    }

    if (inputData.releaseDate && inputData.discountDays) {
      const discountPeriod = DateCalculator.calculateDiscountPeriod(
        inputData.releaseDate,
        inputData.discountDays,
      );

      processed.startDate = DateCalculator.formatDate(
        discountPeriod.startDate,
        "YYYY年MM月DD日",
      );
      processed.endDate = DateCalculator.formatDate(
        discountPeriod.endDate,
        "YYYY年MM月DD日",
      );
      processed.startDateISO = discountPeriod.startDateFormatted;
      processed.endDateISO = discountPeriod.endDateFormatted;
      processed.startDateNoYear = DateCalculator.formatDate(
        discountPeriod.startDate,
        "MM月DD日",
      );
      processed.endDateNoYear = DateCalculator.formatDate(
        discountPeriod.endDate,
        "MM月DD日",
      );
      processed.startDateNoYearEN = DateCalculator.formatDate(
        discountPeriod.startDate,
        "MMM DD",
      );
      processed.endDateNoYearEN = DateCalculator.formatDate(
        discountPeriod.endDate,
        "MMM DD",
      );
      processed.days = inputData.discountDays;
    }

    processed.now = DateCalculator.getCurrentDateTime("YYYY年MM月DD日");
    processed.nowISO = DateCalculator.getCurrentDateTime("YYYY-MM-DD");
    processed.nowTime = DateCalculator.getCurrentDateTime("YYYY-MM-DD HH:mm");

    if (inputData.originalPrice && inputData.discountPercentage) {
      const priceTable = PriceCalculator.createPriceTable(
        inputData.originalPrice,
        [inputData.discountPercentage],
        "JPY",
      );
      processed.priceTable = priceTable;
    }

    return processed;
  }

  generateDefaultOutputPath(inputData, templateName) {
    const baseName = inputData.productId || inputData.title || "dlsite-output";
    const fileName = FileProcessor.generateFileName(baseName, ".txt", true);
    return path.join(process.cwd(), "output", fileName);
  }

  async validateTemplate(templateName, inputData) {
    try {
      const template = await this.templateEngine.loadTemplate(templateName);
      const processedData = await this.processData(inputData);
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
        description: `DLsite template requiring: ${variables.join(", ")}`,
      };
    } catch (error) {
      throw new Error(`Failed to get template info: ${error.message}`);
    }
  }
}

module.exports = DLsiteTool;
