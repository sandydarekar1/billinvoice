import type { GSTSuggestions } from "@/types";

// Comprehensive HSN code database (20+ categories)
const HSN_DATABASE: GSTSuggestions[] = [
  { hsnCode: "0101", description: "Live horses, asses, mules and hinnies", gstRate: 0, category: "Live Animals" },
  { hsnCode: "0201", description: "Meat of bovine animals, fresh or chilled", gstRate: 0, category: "Meat" },
  { hsnCode: "0401", description: "Milk and cream, not concentrated nor sweetened", gstRate: 0, category: "Dairy" },
  { hsnCode: "0701", description: "Potatoes, fresh or chilled", gstRate: 0, category: "Vegetables" },
  { hsnCode: "0801", description: "Coconuts, Brazil nuts and cashew nuts, fresh or dried", gstRate: 0, category: "Fruits & Nuts" },
  { hsnCode: "0902", description: "Tea, whether or not flavoured", gstRate: 5, category: "Beverages" },
  { hsnCode: "1001", description: "Wheat and meslin", gstRate: 0, category: "Cereals" },
  { hsnCode: "1101", description: "Wheat or meslin flour", gstRate: 5, category: "Milling Products" },
  { hsnCode: "1507", description: "Soya-bean oil and its fractions", gstRate: 5, category: "Edible Oils" },
  { hsnCode: "1701", description: "Cane or beet sugar and chemically pure sucrose", gstRate: 5, category: "Sugar" },
  { hsnCode: "2202", description: "Waters, including mineral waters and aerated waters", gstRate: 28, category: "Beverages" },
  { hsnCode: "2523", description: "Portland cement, aluminous cement, slag cement", gstRate: 28, category: "Cement" },
  { hsnCode: "2710", description: "Petroleum oils and oils from bituminous minerals", gstRate: 18, category: "Fuel" },
  { hsnCode: "3004", description: "Medicaments consisting of mixed or unmixed products", gstRate: 12, category: "Pharmaceuticals" },
  { hsnCode: "3923", description: "Articles for the conveyance or packing of goods", gstRate: 18, category: "Plastics" },
  { hsnCode: "3924", description: "Tableware, kitchenware, other household articles", gstRate: 12, category: "Plastics" },
  { hsnCode: "4901", description: "Printed books, brochures, leaflets and similar printed matter", gstRate: 0, category: "Printed Products" },
  { hsnCode: "6109", description: "T-shirts, singlets and other vests, knitted or crocheted", gstRate: 12, category: "Apparel" },
  { hsnCode: "6204", description: "Women's or girls' suits, ensembles, jackets, dresses, skirts", gstRate: 12, category: "Apparel" },
  { hsnCode: "6911", description: "Tableware, kitchenware, other household articles of porcelain", gstRate: 18, category: "Ceramics" },
  { hsnCode: "7108", description: "Gold (including gold plated with platinum) unwrought", gstRate: 3, category: "Precious Metals" },
  { hsnCode: "7113", description: "Articles of jewellery and parts thereof", gstRate: 3, category: "Jewellery" },
  { hsnCode: "7318", description: "Screws, bolts, nuts, coach screws, screw hooks, rivets", gstRate: 18, category: "Iron & Steel" },
  { hsnCode: "8415", description: "Air conditioning machines", gstRate: 28, category: "Electronics" },
  { hsnCode: "8471", description: "Automatic data processing machines and units thereof", gstRate: 18, category: "Electronics" },
  { hsnCode: "8504", description: "Electrical transformers, static converters and inductors", gstRate: 18, category: "Electrical" },
  { hsnCode: "8517", description: "Telephone sets; other apparatus for transmission of voice", gstRate: 18, category: "Telecom" },
  { hsnCode: "8528", description: "Monitors and projectors; television reception apparatus", gstRate: 28, category: "Electronics" },
  { hsnCode: "8703", description: "Motor cars and other motor vehicles principally designed", gstRate: 28, category: "Automobiles" },
  { hsnCode: "9403", description: "Other furniture and parts thereof", gstRate: 18, category: "Furniture" },
  { hsnCode: "9404", description: "Mattress supports; articles of bedding and similar furnishing", gstRate: 12, category: "Furniture" },
  { hsnCode: "9602", description: "Worked vegetable or mineral carving material", gstRate: 12, category: "Miscellaneous" },
  { hsnCode: "9983", description: "Information technology (IT) consulting and support services", gstRate: 18, category: "Services" },
  { hsnCode: "9984", description: "Telecommunication, broadcasting and information supply", gstRate: 18, category: "Services" },
  { hsnCode: "9985", description: "Employment services including personnel search", gstRate: 18, category: "Services" },
  { hsnCode: "9986", description: "Research and development services", gstRate: 18, category: "Services" },
  { hsnCode: "9987", description: "Legal and accounting services", gstRate: 18, category: "Services" },
  { hsnCode: "9988", description: "Advertising services and provision of advertising space", gstRate: 18, category: "Services" },
  { hsnCode: "9989", description: "Management consulting and management services", gstRate: 18, category: "Services" },
  { hsnCode: "9994", description: "Construction services of buildings", gstRate: 18, category: "Services" },
];

export function searchHSN(query: string, limit = 10): GSTSuggestions[] {
  const q = query.toLowerCase();
  return HSN_DATABASE
    .filter(
      (h) =>
        h.hsnCode.includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

export function getHSNByCode(code: string): GSTSuggestions | undefined {
  return HSN_DATABASE.find((h) => h.hsnCode === code);
}

export function getHSNSuggestions(keywords: string[]): GSTSuggestions[] {
  const results: GSTSuggestions[] = [];
  for (const kw of keywords) {
    const matches = searchHSN(kw, 3);
    results.push(...matches);
  }
  return Array.from(new Map(results.map((r) => [r.hsnCode, r])).values());
}

export function getCategories(): string[] {
  return Array.from(new Set(HSN_DATABASE.map((h) => h.category))).sort();
}

export function getGSTRateForHSN(hsnCode: string): number | undefined {
  return getHSNByCode(hsnCode)?.gstRate;
}

export function validateGSTIN(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
}

export function getPlaceOfSupplyFromGSTIN(gstin: string): string | undefined {
  if (!validateGSTIN(gstin)) return undefined;
  const stateCodes: Record<string, string> = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
    "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
    "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
    "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
    "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam",
    "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
    "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
    "26": "Dadra & Nagar Haveli", "27": "Maharashtra", "28": "Andhra Pradesh",
    "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
    "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
    "35": "Andaman & Nicobar", "36": "Telangana", "37": "Andhra Pradesh (New)",
    "38": "Ladakh",
  };
  return stateCodes[gstin.substring(0, 2)];
}
