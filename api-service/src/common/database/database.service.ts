import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  public db: NodePgDatabase<typeof schema>;

  async onModuleInit() {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/app',
      });
      
      this.db = drizzle(pool, { schema });
      
      this.logger.log('Drizzle ORM initialised');
      
      // We still want to ensure the table exists if not using migrator
      // In a real app, use drizzle-kit push or migrations
      await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY,
          sender TEXT NOT NULL,
          receiver TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          template_category TEXT,
          status TEXT NOT NULL,
          attempts INTEGER DEFAULT 0,
          fail_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          sent_at TIMESTAMP WITH TIME ZONE,
          delivered_at TIMESTAMP WITH TIME ZONE,
          read_at TIMESTAMP WITH TIME ZONE
        );
      `);
    } catch (error) {
      this.logger.error('Failed to initialize database', error);
      throw error;
    }
  }
}
