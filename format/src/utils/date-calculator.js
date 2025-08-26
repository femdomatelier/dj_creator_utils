class DateCalculator {
  static parseDate(dateString) {
    if (!dateString) {
      throw new Error("Date string is required");
    }

    if (
      typeof dateString === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateString}`);
      }
      return date;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(
        `Invalid date format: ${dateString}. Supported formats: YYYY-MM-DD or ISO date string`,
      );
    }

    return date;
  }

  static formatDate(date, format = "YYYY-MM-DD") {
    if (!(date instanceof Date)) {
      date = this.parseDate(date);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const formats = {
      "YYYY-MM-DD": `${year}-${month}-${day}`,
      "YYYY/MM/DD": `${year}/${month}/${day}`,
      "MM/DD/YYYY": `${month}/${day}/${year}`,
      "DD/MM/YYYY": `${day}/${month}/${year}`,
      "YYYY-MM-DD HH:mm": `${year}-${month}-${day} ${hours}:${minutes}`,
      "MM/DD": `${month}/${day}`,
      YYYY年MM月DD日: `${year}年${month}月${day}日`,
      MM月DD日: `${month}月${day}日`,
      "MMM DD": this.getMonthNameEN(date.getMonth()) + ` ${day}`,
    };

    return formats[format] || formats["YYYY-MM-DD"];
  }

  static addDays(date, days) {
    if (!(date instanceof Date)) {
      date = this.parseDate(date);
    }

    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static subtractDays(date, days) {
    return this.addDays(date, -days);
  }

  static getDaysBetween(startDate, endDate) {
    if (!(startDate instanceof Date)) {
      startDate = this.parseDate(startDate);
    }
    if (!(endDate instanceof Date)) {
      endDate = this.parseDate(endDate);
    }

    const timeDifference = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
  }

  static isValidDate(dateString) {
    try {
      this.parseDate(dateString);
      return true;
    } catch {
      return false;
    }
  }

  static getWeekday(date, locale = "en") {
    if (!(date instanceof Date)) {
      date = this.parseDate(date);
    }

    const weekdays = {
      en: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      ja: [
        "日曜日",
        "月曜日",
        "火曜日",
        "水曜日",
        "木曜日",
        "金曜日",
        "土曜日",
      ],
      zh: [
        "星期日",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
      ],
    };

    return weekdays[locale]?.[date.getDay()] || weekdays.en[date.getDay()];
  }

  static calculateDiscountPeriod(releaseDate, discountDays) {
    if (!(releaseDate instanceof Date)) {
      releaseDate = this.parseDate(releaseDate);
    }

    const endDate = this.addDays(releaseDate, discountDays);

    return {
      startDate: releaseDate,
      endDate: endDate,
      startDateFormatted: this.formatDate(releaseDate),
      endDateFormatted: this.formatDate(endDate),
      durationDays: discountDays,
    };
  }

  static getCurrentDateTime(format = "YYYY-MM-DD HH:mm") {
    return this.formatDate(new Date(), format);
  }

  static isDateInPast(date) {
    if (!(date instanceof Date)) {
      date = this.parseDate(date);
    }
    return date < new Date();
  }

  static isDateInFuture(date) {
    if (!(date instanceof Date)) {
      date = this.parseDate(date);
    }
    return date > new Date();
  }

  static getMonthNameEN(monthIndex) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months[monthIndex];
  }
}

module.exports = DateCalculator;
