import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const uri = process.env.CONTACT_MONGODB_URI;
if (!uri) {
  console.error('MISSING_URI');
  process.exit(1);
}
await mongoose.connect(uri);
const orderModel = (await import('./models/orderModel.js')).default;
const total = await orderModel.countDocuments();
const sample = await orderModel.findOne({}).lean();
const statuses = await orderModel.distinct('status');
const paymentValues = await orderModel.distinct('payment');
const amountValues = await orderModel.aggregate([{ $group: { _id: null, minAmount: { $min: '$amount' }, maxAmount: { $max: '$amount' }, avgAmount: { $avg: '$amount' }, sampleAmount: { $first: '$amount' } } }]);
console.log(JSON.stringify({ total, sample: sample || null, statuses, paymentValues, amountValues }, null, 2));
await mongoose.disconnect();
