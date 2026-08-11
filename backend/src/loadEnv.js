import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');

// Load backend/.env first (higher priority), then root .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(root, '.env') });
