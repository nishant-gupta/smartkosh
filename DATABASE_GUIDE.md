# Database Guide
## Best Practices for Database Changes

1. **Always use `prisma migrate dev` instead of `prisma db push`**

```bash
npx prisma migrate dev --name descriptive_name_of_change
```

2. **Commit migration files to version control**

3. **For production deployments, use `prisma migrate deploy`**

```bash
npx prisma migrate deploy
```

4. **Never edit migration files after they have been applied to any environment**

5. **If migration errors occur, resolve with `prisma migrate resolve`**

```bash
# For migrations that have been manually fixed
npx prisma migrate resolve --applied "migration_name"

# For migrations that need to be rolled back
npx prisma migrate resolve --rolled-back "migration_name"
```

## Migration Commands Reference

- `npx prisma migrate dev`: Creates a new migration based on schema changes and applies it to development database
- `npx prisma migrate deploy`: Applies pending migrations to a database (for production)
- `npx prisma migrate status`: Shows current migration status
- `npx prisma migrate reset`: Resets database and reapplies all migrations (development only!)

## Database Sync

To sync data from production to development database:

1. **Set up environment variables**
   Add these to your `.env` file:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dev_db"
   PROD_DATABASE_URL="postgresql://user:password@prod-host:5432/prod_db"
   ```

2. **Run the sync script**
   ```bash
   npm run sync-db
   ```

The sync script will:
- Copy all data from production to development
- Maintain relationships between models
- Handle JSON fields and special data types
- Use upsert operations for data consistency

⚠️ **Important Notes:**
- Back up your development database before syncing
- The script will overwrite existing data in development
- Ensure you have proper access to production database
- Run migrations before syncing if schema has changed

## Prisma Studio

To view and manage your database through Prisma's GUI:

```bash
npx prisma studio
```

This will:
- Open Prisma Studio in your default browser (usually at http://localhost:5555)
- Allow you to view, create, edit, and delete records
- Show relationships between models
- Provide a user-friendly interface for database management

## Common Database Tasks

1. **Reset Development Database**
   ```bash
   npx prisma migrate reset
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Format Schema**
   ```bash
   npx prisma format
   ```

4. **Validate Schema**
   ```bash
   npx prisma validate
   ```

5. **View Database Schema**
   ```bash
   npx prisma db pull
   ```

