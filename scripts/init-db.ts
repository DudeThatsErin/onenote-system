import { ensureSchema } from '../src/lib/db';
ensureSchema().then(() => console.log('OneNote Queue database schema is ready.'));
