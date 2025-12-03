const Vendor = require("../models/Vendor");

const vendorData = [
  {
    name: "TechSupply Inc",
    email: "sales@techsupply.com",
    contactPerson: "John Smith",
    phone: "+1-555-0101",
    category: ["IT", "Hardware"],
    rating: 4.5,
  },
  {
    name: "Global Hardware Solutions",
    email: "info@globalhardware.com",
    contactPerson: "Sarah Johnson",
    phone: "+1-555-0102",
    category: ["Hardware", "Electronics"],
    rating: 4.2,
  },
  {
    name: "Office Equipment Pro",
    email: "contact@officeequipmentpro.com",
    contactPerson: "Mike Davis",
    phone: "+1-555-0103",
    category: ["Office Supplies", "Furniture"],
    rating: 4.0,
  },
  {
    name: "Enterprise IT Partners",
    email: "sales@enterpriseit.com",
    contactPerson: "Emily Chen",
    phone: "+1-555-0104",
    category: ["IT", "Software", "Consulting"],
    rating: 4.7,
  },
  {
    name: "Industrial Supplies Co",
    email: "orders@industrialsupplies.com",
    contactPerson: "Robert Williams",
    phone: "+1-555-0105",
    category: ["Industrial", "Manufacturing"],
    rating: 4.3,
  },
];

const seedVendors = async () => {
  try {
    const count = await Vendor.countDocuments();

    if (count > 0) {
      console.log("✓ Vendors already exist in database, skipping seeding");
      return;
    }

    await Vendor.insertMany(vendorData);
    console.log(`✓ Successfully seeded ${vendorData.length} vendors`);
  } catch (error) {
    console.error("✗ Error seeding vendors:", error.message);
  }
};

module.exports = { seedVendors };
