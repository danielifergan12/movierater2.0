const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function startMongoDB() {
  try {
    console.log('Starting MongoDB in memory...');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    console.log('MongoDB started at:', mongoUri);
    console.log('Update your .env file with:');
    console.log(`MONGODB_URI=${mongoUri}`);
    
    // Keep the server running
    process.on('SIGINT', async () => {
      console.log('\nShutting down MongoDB...');
      await mongoServer.stop();
      process.exit(0);
    });
    
    // Keep the process alive
    setInterval(() => {}, 1000);
    
  } catch (error) {
    console.error('Error starting MongoDB:', error);
    process.exit(1);
  }
}

startMongoDB();
