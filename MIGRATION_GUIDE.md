# Database Migration Guide
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

