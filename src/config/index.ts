import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT) || 4000,
  jwt: {
    access_secret: process.env.ACCESS_SECRET || 'access_secret',
    refresh_secret: process.env.REFRESH_SECRET,
    access_expires_in: process.env.ACCESS_EXPIRES_IN,
    refresh_expires_in: process.env.REFRESH_EXPIRES_IN,
  },
};
