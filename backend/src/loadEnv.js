import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// En Render/producción las variables vienen del panel; dotenv solo en desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');
  const root = path.join(__dirname, '../..');

  dotenv.config({ path: path.join(__dirname, '../.env') });
  dotenv.config({ path: path.join(root, '.env') });
}
