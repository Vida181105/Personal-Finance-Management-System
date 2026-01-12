const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't include password in queries by default
    },
    phone: {
      type: String,
    },
    profession: {
      type: String,
    },
    monthlyIncome: {
      type: Number,
      required: true,
      min: 0,
    },
    city: {
      type: String,
    },
    age: {
      type: Number,
      min: 18,
      max: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    accountCreatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password before saving if it has been modified
 */
userSchema.pre('save', async function () {
  try {
    // Only hash if password is new or modified
    if (!this.isModified('password')) {
      return;
    }

    // Generate salt and hash password
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

/**
 * Compare provided password with hashed password
 * @param {String} candidatePassword - Password to compare
 * @returns {Promise<Boolean>} True if password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcryptjs.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

/**
 * Get user data without sensitive fields
 * @returns {Object} User object without password
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
