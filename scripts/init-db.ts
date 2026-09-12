import { ensureSchema } from '../src/lib/db';
ensureSchema().then(() => console.log('OneNote System database schema is ready.'));
