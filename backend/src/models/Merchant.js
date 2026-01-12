const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema(
  {
    merchantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantName: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
    },
    merchantType: {
      type: String,
      enum: ['Online', 'Offline'],
    },
    city: {
      type: String,
    },
    website: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Merchant', merchantSchema);
