import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../lib/models/User';

async function createAdmin() {
  const args = process.argv.slice(2);
  const parsedArgs: Record<string, string> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (key && value) {
        parsedArgs[key] = value;
      }
    }
  }

  const email = parsedArgs.email || process.env.ADMIN_EMAIL;
  const password = parsedArgs.password || process.env.ADMIN_PASSWORD;
  const firstName = parsedArgs.firstName || 'Platform';
  const lastName = parsedArgs.lastName || 'Admin';

  if (!email || !password) {
    console.error(
      'Usage: npm run create-admin -- --email=admin@example.com --password=StrongPassword123 --firstName=System --lastName=Admin'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Admin password must be at least 8 characters long.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/echoprep';

  try {
    console.log(`Connecting to database: ${mongoUri.replace(/:([^:@]{1,})@/, ':****@')}...`);
    await mongoose.connect(mongoUri);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`Admin user with email ${email} already exists.`);
        process.exit(0);
      } else {
        console.log(`User exists with role '${existingUser.role}'. Promoting to 'admin'...`);
        existingUser.role = 'admin';
        existingUser.password = password; // pre-save hook will hash
        await existingUser.save();
        console.log(`User ${email} successfully promoted to admin.`);
        process.exit(0);
      }
    }

    const adminUser = new User({
      email,
      password,
      firstName,
      lastName,
      role: 'admin'
    });

    await adminUser.save();
    console.log(`Successfully created admin user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
