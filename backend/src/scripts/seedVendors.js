require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');

const vendors = [
  {
    name: 'TechGear Solutions',
    email: 'sales@techgear.com',
    contactPerson: 'John Smith',
    phone: '+1-555-0101',
    category: ['laptops', 'monitors', 'accessories'],
    rating: 4.5
  },
  {
    name: 'Office Supplies Pro',
    email: 'orders@officesupplies.com',
    contactPerson: 'Sarah Johnson',
    phone: '+1-555-0102',
    category: ['furniture', 'stationery', 'office-equipment'],
    rating: 4.2
  },
  {
    name: 'Digital Electronics Co',
    email: 'info@digitalelectronics.com',
    contactPerson: 'Michael Chen',
    phone: '+1-555-0103',
    category: ['laptops', 'tablets', 'smartphones'],
    rating: 4.7
  },
  {
    name: 'Premier Hardware Inc',
    email: 'contact@premierhardware.com',
    contactPerson: 'Emily Davis',
    phone: '+1-555-0104',
    category: ['monitors', 'keyboards', 'peripherals'],
    rating: 4.4
  },
  {
    name: 'Global Tech Distributors',
    email: 'sales@globaltech.com',
    contactPerson: 'David Wilson',
    phone: '+1-555-0105',
    category: ['laptops', 'servers', 'networking'],
    rating: 4.6
  },
  {
    name: 'Smart Office Solutions',
    email: 'info@smartoffice.com',
    contactPerson: 'Lisa Anderson',
    phone: '+1-555-0106',
    category: ['furniture', 'monitors', 'ergonomic-equipment'],
    rating: 4.3
  },
  {
    name: 'IT Warehouse Direct',
    email: 'orders@itwarehouse.com',
    contactPerson: 'Robert Martinez',
    phone: '+1-555-0107',
    category: ['laptops', 'desktops', 'components'],
    rating: 4.5
  },
  {
    name: 'Corporate Supplies Ltd',
    email: 'sales@corporatesupplies.com',
    contactPerson: 'Jennifer Taylor',
    phone: '+1-555-0108',
    category: ['office-equipment', 'furniture', 'stationery'],
    rating: 4.1
  },
  {
    name: 'Tech Valley Partners',
    email: 'contact@techvalley.com',
    contactPerson: 'Christopher Brown',
    phone: '+1-555-0109',
    category: ['monitors', 'displays', 'projectors'],
    rating: 4.6
  },
  {
    name: 'Enterprise Solutions Group',
    email: 'info@enterprisesg.com',
    contactPerson: 'Amanda White',
    phone: '+1-555-0110',
    category: ['laptops', 'monitors', 'software', 'support-services'],
    rating: 4.8
  }
];

const seedVendors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Vendor.deleteMany({});
    console.log('Cleared existing vendors');

    await Vendor.insertMany(vendors);
    console.log('Successfully seeded 10 vendors');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding vendors:', error);
    process.exit(1);
  }
};

seedVendors();
