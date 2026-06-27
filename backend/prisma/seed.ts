import { prisma } from "../src/config/db";
import bcrypt from "bcrypt";

async function main() {
  console.log("Starting seeding of exact frontend properties...");

  // Clear existing data (Prisma Cascade delete will clean up relations)
  await prisma.tenant.deleteMany({});
  console.log("Cleared existing tenants database entries.");

  const passwordHash = bcrypt.hashSync("password123", 10);

  // Define properties and outlets as Tenants
  const tenantsConfig = [
    {
      key: "roof",
      name: "Terralogic Grand Hyderabad - Skyline Rooftop",
      brandName: "Skyline Rooftop",
      address: "Skyline Rooftop, Hyderabad",
      categories: ["Starters", "Grill", "Fry", "Main Course", "Desserts", "Beverages"],
      menuItems: [
        { name: "Paneer Tikka", description: "Toasted cottage cheese with modifiers", price: 340, prepTime: 12, veg: true, categoryName: "Starters" },
        { name: "Smoked Corn Tacos", description: "Smoked sweet corn tacos", price: 290, prepTime: 9, veg: true, categoryName: "Grill" },
        { name: "Masala Fries", description: "Crispy fries with peri peri seasoning", price: 210, prepTime: 6, veg: true, categoryName: "Fry" },
        { name: "Chicken Tikka Masala", description: "Roasted marinated chicken chunks in spiced curry sauce", price: 450, prepTime: 18, veg: false, categoryName: "Main Course" },
        { name: "Butter Naan", description: "Soft Indian flatbread brushed with butter", price: 60, prepTime: 5, veg: true, categoryName: "Main Course" },
        { name: "Chocolate Lava Cake", description: "Warm chocolate cake with molten center", price: 250, prepTime: 10, veg: true, categoryName: "Desserts" },
        { name: "Virgin Mojito", description: "Refreshing mint and lime mocktail", price: 180, prepTime: 3, veg: true, categoryName: "Beverages" },
      ],
      tables: [
        { number: 1, capacity: 2 }, // T1
        { number: 2, capacity: 4 }, // T2
        { number: 3, capacity: 4 }, // T3
        { number: 4, capacity: 6 }, // T4
        { number: 5, capacity: 2 }, // T5
        { number: 6, capacity: 4 }, // T6
        { number: 7, capacity: 8 }, // T7
        { number: 8, capacity: 10 }, // T8
      ],
    },
    {
      key: "cafe",
      name: "Terralogic Grand Hyderabad - Atrium Cafe",
      brandName: "Atrium Cafe",
      address: "Atrium Cafe Lobby, Hyderabad",
      categories: ["Beverages", "Live Station"],
      menuItems: [
        { name: "Filter Coffee", description: "Traditional south Indian hot brew", price: 140, prepTime: 4, veg: true, categoryName: "Beverages" },
        { name: "Ghee Roast Dosa", description: "Crispy dosa with ghee, sambar, and chutney", price: 260, prepTime: 10, veg: true, categoryName: "Live Station" },
      ],
      tables: [
        { number: 5, capacity: 2 }, // C1
        { number: 6, capacity: 4 }, // C2
      ],
    },
    {
      key: "banquet",
      name: "Terralogic Grand Bengaluru - Mysore Hall",
      brandName: "Mysore Hall",
      address: "Mysore Hall Banquet, Bengaluru",
      categories: ["Banquet Special"],
      menuItems: [
        { name: "Hyderabadi Veg Biryani", description: "Aromatic basmati rice cooked with fresh veggies", price: 420, prepTime: 15, veg: true, categoryName: "Banquet Special" },
      ],
      tables: [
        { number: 7, capacity: 8 },  // B1
        { number: 8, capacity: 10 }, // B2
      ],
    },
  ];

  for (const tc of tenantsConfig) {
    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tc.name,
        brandName: tc.brandName,
        address: tc.address,
      },
    });
    console.log(`Created Tenant: ${tenant.name} (${tenant.id})`);

    // 2. Create Role Users for this Tenant
    const roles = ["ADMIN", "MANAGER", "WAITER", "CHEF", "CASHIER"] as const;
    for (const r of roles) {
      const email = `${r.toLowerCase()}-${tc.key}@hotelpos.com`;
      const name = `${tc.brandName} ${r.charAt(0) + r.slice(1).toLowerCase()}`;
      await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role: r,
          tenantId: tenant.id,
        },
      });
      console.log(`  Created User: ${name} (${email})`);
    }

    // 3. Create Categories
    const categoryIdMap: Record<string, string> = {};
    for (const catName of tc.categories) {
      const category = await prisma.category.create({
        data: {
          name: catName,
          tenantId: tenant.id,
        },
      });
      categoryIdMap[catName] = category.id;
      console.log(`  Created Category: ${category.name}`);
    }

    // 4. Create Menu Items
    for (const mi of tc.menuItems) {
      const catId = categoryIdMap[mi.categoryName];
      await prisma.menuItem.create({
        data: {
          name: mi.name,
          description: mi.description,
          price: mi.price,
          prepTime: mi.prepTime,
          veg: mi.veg,
          categoryId: catId,
          tenantId: tenant.id,
        },
      });
      console.log(`  Created Menu Item: ${mi.name}`);
    }

    // 5. Create Tables
    for (const t of tc.tables) {
      await prisma.table.create({
        data: {
          number: t.number,
          capacity: t.capacity,
          status: "AVAILABLE",
          tenantId: tenant.id,
        },
      });
      console.log(`  Created Table: #${t.number} (${t.capacity} seats)`);
    }
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
