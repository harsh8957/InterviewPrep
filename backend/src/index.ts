import 'dotenv/config';
import { app } from './app';
import { connectDB } from './lib/db';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
