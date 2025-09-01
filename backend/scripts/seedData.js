const mongoose = require("mongoose");
const User = require("../models/User");
const Brand = require("../models/Brand");
const Product = require("../models/Product");
const Store = require("../models/Store");
require("dotenv").config();

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ngr-test");
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});
    await Store.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // Create test user
    const user = new User({
      username: "testuser",
      email: "test@example.com",
      status: "active",
      points: {
        balance: 0,
        amount: 0,
        status: "active",
      },
    });
    await user.save();
    console.log("👤 Created test user");

    // Create brands
    const brands = [
      { name: "Nestle" },
      { name: "Coca-Cola" },
      { name: "Pepsi" },
      { name: "Unilever" },
      { name: "Procter & Gamble" },
    ];

    const createdBrands = await Brand.insertMany(brands);
    console.log("🏷️ Created brands");

    // Create products
    const products = [
      {
        name: "Nestle Milo 200g",
        normalized_name: "nestle milo 200g",
        brandId: createdBrands[0]._id,
        volume: 200,
        volumeUnit: "g",
        points: 10,
        dateExpiry: new Date("2025-12-31"),
        keywords: ["milo", "chocolate", "drink", "powder"],
      },
      {
        name: "Nestle Coffee Mate 170g",
        normalized_name: "nestle coffee mate 170g",
        brandId: createdBrands[0]._id,
        volume: 170,
        volumeUnit: "g",
        points: 8,
        dateExpiry: new Date("2025-12-31"),
        keywords: ["coffee", "mate", "creamer", "powder"],
      },
      {
        name: "Coca-Cola 1.5L",
        normalized_name: "coca cola 15l",
        brandId: createdBrands[1]._id,
        volume: 1.5,
        volumeUnit: "l",
        points: 5,
        dateExpiry: new Date("2025-12-31"),
        keywords: ["coke", "cola", "soda", "drink"],
      },
      {
        name: "Pepsi 330ml",
        normalized_name: "pepsi 330ml",
        brandId: createdBrands[2]._id,
        volume: 330,
        volumeUnit: "ml",
        points: 3,
        dateExpiry: new Date("2025-12-31"),
        keywords: ["pepsi", "soda", "drink", "can"],
      },
      {
        name: "Dove Soap 100g",
        normalized_name: "dove soap 100g",
        brandId: createdBrands[3]._id,
        volume: 100,
        volumeUnit: "g",
        points: 15,
        dateExpiry: new Date("2025-12-31"),
        keywords: ["dove", "soap", "bath", "body"],
      },
      {
        name: "Pampers Diapers M",
        normalized_name: "pampers diapers m",
        brandId: createdBrands[4]._id,
        volume: 1,
        volumeUnit: "pack",
        points: 25,
        dateExpiry: new Date("2025-12-31"),
        keywords: ["pampers", "diapers", "baby", "care"],
      },
      {
        name: "BBRAND JR 2.4kg",
        normalized_name: "bbrand jr 24kg",
        brandId: createdBrands[0]._id, // Using Nestle brand
        volume: 2.4,
        volumeUnit: "kg",
        points: 50,
        dateExpiry: new Date("2025-12-31"),
        keywords: ["bbrand", "jr", "24kg", "milk", "powder"],
      },
    ];

    await Product.insertMany(products);
    console.log("🛍️ Created products");

    // Create stores
    const stores = [
      {
        name: "SM HYPERMARKET",
        normalized_name: "sm hypermarket",
        type: "physical",
        keywords: ["sm", "hypermarket", "supermarket", "mall"],
      },
      {
        name: "ROBINSONS SUPERMARKET",
        normalized_name: "robinsons supermarket",
        type: "physical",
        keywords: ["robinsons", "supermarket", "mall"],
      },
      {
        name: "PUREGOLD",
        normalized_name: "puregold",
        type: "physical",
        keywords: ["puregold", "supermarket", "grocery"],
      },
      {
        name: "7-ELEVEN",
        normalized_name: "7 eleven",
        type: "physical",
        keywords: ["7-eleven", "convenience", "store"],
      },
      {
        name: "SAVEMORE",
        normalized_name: "savemore",
        type: "physical",
        keywords: ["savemore", "supermarket", "grocery"],
      },
      {
        name: "MERCURY DRUG",
        normalized_name: "mercury drug",
        type: "physical",
        keywords: ["mercury", "drug", "pharmacy", "medicine"],
      },
    ];

    await Store.insertMany(stores);
    console.log("🏪 Created stores");

    console.log("\n🎉 Seed data created successfully!");
    console.log(`👤 Test User ID: ${user._id}`);
    console.log(`📧 Test User Email: ${user.email}`);
    console.log(`🔑 Test User Username: ${user.username}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
