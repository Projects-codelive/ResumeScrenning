const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/resumebuilder', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User model (basic structure)
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function deleteAllUsers() {
  try {
    const result = await User.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    process.exit(1);
  }
}

deleteAllUsers();
