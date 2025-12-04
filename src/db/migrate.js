import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import supabaseAdmin from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Running database migrations...');
    
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    
    // Split by semicolons but keep multi-line statements together
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.error('Migration error:', error);
          // Continue with other statements
        }
      } catch (err) {
        console.error('Statement execution error:', err.message);
      }
    }

    console.log('✅ Database migrations completed!');
    console.log('\nNote: If you see errors, you may need to run the schema.sql file directly in your Supabase SQL editor.');
    console.log('You can find it at: src/db/schema.sql');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
