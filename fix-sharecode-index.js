// Script to fix shareCode index issue
// Run this once to clean up existing users with shareCode: null

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function fixShareCodeIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movierating');
    console.log('Connected to MongoDB');

    // Remove shareCode field from users where it's null or undefined
    const result = await User.updateMany(
      { shareCode: null },
      { $unset: { shareCode: "" } }
    );
    console.log(`Removed shareCode: null from ${result.modifiedCount} users`);

    // Also remove from users where shareCode is undefined (shouldn't be many)
    const result2 = await User.updateMany(
      { shareCode: { $exists: false } },
      { $unset: { shareCode: "" } }
    );
    console.log(`Cleaned up ${result2.modifiedCount} users with undefined shareCode`);

    // Drop the existing index
    try {
      await User.collection.dropIndex('shareCode_1');
      console.log('Dropped existing shareCode_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index shareCode_1 does not exist, skipping drop');
      } else {
        throw error;
      }
    }

    // The index will be recreated automatically by Mongoose with the new schema
    console.log('Index will be recreated on next server start with sparse: true');

    console.log('Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing shareCode index:', error);
    process.exit(1);
  }
}

fixShareCodeIndex();

