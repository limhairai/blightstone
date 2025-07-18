# Database Migrations

This directory contains all database migrations for the AdHub project.

## Migration Strategy

The current database schema is built from **all migration files** in chronological order, not from a single "comprehensive" schema file.

### Key Files

- `20250120000000_initial_schema_with_semantic_ids.sql` - The initial schema setup (renamed from "comprehensive" for clarity)
- `20250120000001_add_bank_transfer_tables.sql` and onwards - Incremental changes to the schema

### Important Notes

1. **No Single Source of Truth**: There is no single file that represents the current complete schema
2. **Sequential Application**: Migrations are applied in timestamp order (YYYYMMDDHHMMSS format)
3. **Current State**: To understand the current schema, you need to review all migration files
4. **Fresh Deployments**: New environments apply all migrations from the beginning

### Schema Evolution

The schema has evolved significantly since the initial setup:
- Added bank transfer functionality
- Enhanced RLS policies
- Added support for various asset types (pixels, business managers, ad accounts)
- Improved performance with optimized queries
- Added semantic ID support

### Best Practices

1. **Never modify existing migrations** - always create new ones
2. **Use descriptive names** for migration files
3. **Test migrations** on staging before production
4. **Keep migrations atomic** - one logical change per file
5. **Document breaking changes** in commit messages

### Getting Current Schema

To see the current schema state:
```sql
-- Connect to your database and run:
\d+ -- List all tables with details
\df -- List all functions
```

Or use the Supabase dashboard to view the current schema visually. 