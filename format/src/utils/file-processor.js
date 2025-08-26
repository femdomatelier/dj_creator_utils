const fs = require("fs").promises;
const path = require("path");

class FileProcessor {
  static async readJsonFile(filePath) {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`JSON file not found: ${filePath}`);
      } else if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in file: ${filePath}. ${error.message}`);
      }
      throw error;
    }
  }

  static async readCsvFile(filePath) {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        throw new Error(`CSV file is empty: ${filePath}`);
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          data.push(row);
        }
      }

      return { headers, data };
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`CSV file not found: ${filePath}`);
      }
      throw error;
    }
  }

  static async writeFile(filePath, content) {
    try {
      const absolutePath = path.resolve(filePath);
      const dir = path.dirname(absolutePath);

      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(absolutePath, content, "utf-8");

      return absolutePath;
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  static async ensureDirectory(dirPath) {
    try {
      const absolutePath = path.resolve(dirPath);
      await fs.mkdir(absolutePath, { recursive: true });
      return absolutePath;
    } catch (error) {
      throw new Error(
        `Failed to create directory ${dirPath}: ${error.message}`,
      );
    }
  }

  static async fileExists(filePath) {
    try {
      await fs.access(path.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }

  static generateFileName(baseName, extension = ".txt", timestamp = true) {
    const sanitizedName = baseName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const timeStamp = timestamp
      ? `_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}`
      : "";
    return `${sanitizedName}${timeStamp}${extension}`;
  }

  static async copyFile(srcPath, destPath) {
    try {
      const absoluteSrc = path.resolve(srcPath);
      const absoluteDest = path.resolve(destPath);

      const destDir = path.dirname(absoluteDest);
      await fs.mkdir(destDir, { recursive: true });

      await fs.copyFile(absoluteSrc, absoluteDest);
      return absoluteDest;
    } catch (error) {
      throw new Error(
        `Failed to copy file from ${srcPath} to ${destPath}: ${error.message}`,
      );
    }
  }

  static async deleteFile(filePath) {
    try {
      await fs.unlink(path.resolve(filePath));
      return true;
    } catch (error) {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  static getFileExtension(filePath) {
    return path.extname(filePath).toLowerCase();
  }

  static getBaseName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  static async getFileStats(filePath) {
    try {
      const stats = await fs.stat(path.resolve(filePath));
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get file stats for ${filePath}: ${error.message}`,
      );
    }
  }
}

module.exports = FileProcessor;
