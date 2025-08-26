const fs = require("fs").promises;
const path = require("path");

class TemplateEngine {
  constructor() {
    this.templatesDir = path.join(__dirname, "../examples");
  }

  async loadTemplate(templateName) {
    const templatePath = path.join(this.templatesDir, `${templateName}.txt`);

    try {
      const content = await fs.readFile(templatePath, "utf-8");
      return content;
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(
          `Template "${templateName}" not found at ${templatePath}`,
        );
      }
      throw error;
    }
  }

  extractVariables(template) {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set();
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  validateVariables(template, data) {
    const requiredVariables = this.extractVariables(template);
    const missingVariables = [];

    for (const variable of requiredVariables) {
      if (!(variable in data)) {
        missingVariables.push(variable);
      }
    }

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      requiredVariables,
    };
  }

  render(template, data) {
    const validation = this.validateVariables(template, data);

    if (!validation.isValid) {
      throw new Error(
        `Missing required variables: ${validation.missingVariables.join(", ")}\n` +
          `Required variables: ${validation.requiredVariables.join(", ")}\n` +
          `Available variables: ${Object.keys(data).join(", ")}`,
      );
    }

    let result = template;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      result = result.replace(regex, String(value));
    }

    return result;
  }

  async renderFromTemplate(templateName, data) {
    const template = await this.loadTemplate(templateName);
    return this.render(template, data);
  }

  async getTemplateVariables(templateName) {
    const template = await this.loadTemplate(templateName);
    return this.extractVariables(template);
  }

  async listTemplates() {
    try {
      const files = await fs.readdir(this.templatesDir);
      return files
        .filter((file) => file.endsWith(".txt"))
        .map((file) => path.basename(file, ".txt"));
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}

module.exports = TemplateEngine;
