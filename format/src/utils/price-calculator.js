class PriceCalculator {
  static validatePrice(price) {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      throw new Error(`Invalid price: ${price}`);
    }
    return numPrice;
  }

  static validateDiscount(discount) {
    const numDiscount = Number(discount);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
      throw new Error(
        `Invalid discount percentage: ${discount}. Must be between 0 and 100.`,
      );
    }
    return numDiscount;
  }

  static calculateDiscountedPrice(originalPrice, discountPercentage) {
    const validPrice = this.validatePrice(originalPrice);
    const validDiscount = this.validateDiscount(discountPercentage);

    const discountAmount = (validPrice * validDiscount) / 100;
    const finalPrice = validPrice - discountAmount;

    return {
      originalPrice: validPrice,
      discountPercentage: validDiscount,
      discountAmount: Math.round(discountAmount),
      finalPrice: Math.round(finalPrice),
      savings: Math.round(discountAmount),
    };
  }

  static formatPrice(price, currency = "JPY") {
    const validPrice = this.validatePrice(price);

    const formatters = {
      JPY: (p) => `¥${p.toLocaleString("ja-JP")}`,
      USD: (p) => `$${p.toFixed(2)}`,
      EUR: (p) => `€${p.toFixed(2)}`,
      CNY: (p) => `¥${p.toFixed(2)}`,
      KRW: (p) => `₩${p.toLocaleString("ko-KR")}`,
      TWD: (p) => `NT$${p.toLocaleString("zh-TW")}`,
    };

    const formatter = formatters[currency.toUpperCase()];
    return formatter ? formatter(validPrice) : `${currency}${validPrice}`;
  }

  static calculateTax(price, taxRate = 0.1) {
    const validPrice = this.validatePrice(price);
    const taxAmount = validPrice * taxRate;
    const totalWithTax = validPrice + taxAmount;

    return {
      basePrice: validPrice,
      taxRate: taxRate,
      taxAmount: Math.round(taxAmount),
      totalWithTax: Math.round(totalWithTax),
    };
  }

  static convertCurrency(amount, fromRate, toRate) {
    const validAmount = this.validatePrice(amount);

    if (fromRate <= 0 || toRate <= 0) {
      throw new Error("Currency rates must be positive numbers");
    }

    const convertedAmount = (validAmount / fromRate) * toRate;
    return Math.round(convertedAmount * 100) / 100;
  }

  static calculateBulkDiscount(price, quantity, discountTiers = []) {
    const validPrice = this.validatePrice(price);
    const validQuantity = Math.floor(Number(quantity));

    if (validQuantity <= 0) {
      throw new Error("Quantity must be a positive integer");
    }

    let applicableDiscount = 0;

    for (const tier of discountTiers.sort(
      (a, b) => b.minQuantity - a.minQuantity,
    )) {
      if (validQuantity >= tier.minQuantity) {
        applicableDiscount = tier.discount;
        break;
      }
    }

    const subtotal = validPrice * validQuantity;
    const discountAmount = (subtotal * applicableDiscount) / 100;
    const total = subtotal - discountAmount;

    return {
      price: validPrice,
      quantity: validQuantity,
      subtotal: Math.round(subtotal),
      discountPercentage: applicableDiscount,
      discountAmount: Math.round(discountAmount),
      total: Math.round(total),
    };
  }

  static createPriceTable(
    basePrice,
    discountLevels = [10, 20, 30, 50],
    currency = "JPY",
  ) {
    const validPrice = this.validatePrice(basePrice);
    const priceTable = [];

    priceTable.push({
      label: "Original Price",
      percentage: 0,
      price: validPrice,
      formatted: this.formatPrice(validPrice, currency),
    });

    for (const discount of discountLevels.sort((a, b) => a - b)) {
      const calculation = this.calculateDiscountedPrice(validPrice, discount);
      priceTable.push({
        label: `${discount}% OFF`,
        percentage: discount,
        price: calculation.finalPrice,
        formatted: this.formatPrice(calculation.finalPrice, currency),
        savings: calculation.savings,
        savingsFormatted: this.formatPrice(calculation.savings, currency),
      });
    }

    return priceTable;
  }

  static calculateROI(investment, revenue) {
    const validInvestment = this.validatePrice(investment);
    const validRevenue = this.validatePrice(revenue);

    if (validInvestment === 0) {
      throw new Error("Investment cannot be zero for ROI calculation");
    }

    const profit = validRevenue - validInvestment;
    const roi = (profit / validInvestment) * 100;

    return {
      investment: validInvestment,
      revenue: validRevenue,
      profit: profit,
      roiPercentage: Math.round(roi * 100) / 100,
      isProfit: profit > 0,
    };
  }
}

module.exports = PriceCalculator;
