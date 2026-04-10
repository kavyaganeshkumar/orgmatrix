const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  tenantId: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  industry: { type: String },
  revenue: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  employees: { type: Number, default: 0 },
  year: { type: String },
  region: { type: String },
  logoUrl: { type: String },
  email: { type: String },
  phone: { type: String },
  website: { type: String },
  address: { type: String },
  description: { type: String },
  taxId: { type: String },
  status: { type: String, default: 'active' },
  
  // 💳 Subscription & Billing
  plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  subscriptionStatus: { type: String, default: 'inactive' },
  stripeCustomerId: { type: String },
  
  // 🏢 Tenant Customization
  themeColor: { type: String, default: '#4f46e5' },
  customDomain: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
