# Database Migrations Guide

This project uses TypeORM for database migrations. The following npm scripts are available for managing database schema changes.

## Available Migration Scripts

### 1. Generate Migration
```bash
npm run migration:generate src/database/migrations/MigrationName
```
Automatically generates a migration file by comparing your entities with the current database schema.

**Example:**
```bash
npm run migration:generate src/database/migrations/AddUserProfileTable
```

### 2. Create Empty Migration
```bash
npm run migration:create src/database/migrations/MigrationName
```
Creates an empty migration file that you can manually edit.

**Example:**
```bash
npm run migration:create src/database/migrations/SeedInitialData
```

### 3. Run Migrations
```bash
npm run migration:run
```
Executes all pending migrations in order.

### 4. Revert Migration
```bash
npm run migration:revert
```
Reverts the last executed migration.

### 5. Show Migration Status
```bash
npm run migration:show
```
Shows all migrations and their current status (pending/executed).

### 6. Drop Schema
```bash
npm run schema:drop
```
⚠️ **WARNING**: Drops all database tables. Use with caution!

### 7. Sync Schema
```bash
npm run schema:sync
```
⚠️ **WARNING**: Synchronizes database schema with entities. Use only in development!

## Migration Workflow

### Development Workflow
1. Create/modify your entities
2. Generate migration: `npm run migration:generate src/database/migrations/DescriptiveName`
3. Review the generated migration file
4. Run migration: `npm run migration:run`

### Production Workflow
1. Always use migrations instead of schema sync
2. Test migrations in staging environment first
3. Backup database before running migrations in production
4. Run migrations: `npm run migration:run`

## Example Migration File Structure

Generated migrations will be placed in `src/database/migrations/` and look like:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1644022577574 implements MigrationInterface {
    name = 'CreateUserTable1644022577574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "isVerified" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "user"`);
    }
}
```

## Best Practices

### 1. Always Review Generated Migrations
- Check the SQL queries before running
- Ensure data integrity constraints
- Verify indexes and foreign keys

### 2. Naming Conventions
Use descriptive names for migrations:
- `CreateUserTable`
- `AddEmailIndexToUser`
- `UpdateUserPasswordConstraints`
- `SeedDefaultRoles`

### 3. Data Migrations
For data migrations, create custom migration files:
```typescript
export class SeedDefaultRoles1644022577575 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "role" ("name", "description") VALUES 
            ('admin', 'Administrator role'),
            ('user', 'Regular user role')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "role" WHERE name IN ('admin', 'user')`);
    }
}
```

### 4. Environment Configuration
Set the following environment variables:
```env
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
DATABASE_SYNCHRONIZE=false  # Always false in production
DATABASE_LOGGING=true       # For debugging
```

## Troubleshooting

### Migration Fails
1. Check database connection
2. Verify migration syntax
3. Check for schema conflicts
4. Review entity definitions

### Schema Out of Sync
1. Generate a new migration: `npm run migration:generate src/database/migrations/SyncSchema`
2. Review and run the migration
3. Never use `schema:sync` in production

### Rollback Issues
1. Check the `down` method in your migration
2. Manually write rollback SQL if needed
3. Test rollbacks in development first

## Example Usage

```bash
# 1. Create a new migration for adding user profile
npm run migration:generate src/database/migrations/AddUserProfile

# 2. Review the generated file in src/database/migrations/

# 3. Run the migration
npm run migration:run

# 4. Check migration status
npm run migration:show

# 5. If needed, rollback
npm run migration:revert
```
