import {
  connectToMongo,
  disconnectFromMongo,
} from '../src/services/MongoService';

describe('MongoDB Service', () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/woovi-challenge';

  beforeAll(async () => {
    process.env.MONGO_URI = mongoUri;
  });

  afterAll(async () => {
    await disconnectFromMongo();
  });

  it('connectToMongo should connect to MongoDB successfully', async () => {
    await expect(connectToMongo()).resolves.not.toThrow();
  });

  it('disconnectFromMongo should disconnect from MongoDB successfully', async () => {
    await connectToMongo();
    await expect(disconnectFromMongo()).resolves.not.toThrow();
  });
});
