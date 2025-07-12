# Organization Membership Strategy

## Core Principle: "Membership-First with Owner Fallback"

AdHub uses a hybrid membership model that provides both guaranteed ownership and flexible team collaboration.

## Architecture Overview

### Database Schema
```sql
-- Primary ownership (guarantees an owner always exists)
organizations: {
  organization_id: UUID PRIMARY KEY,
  owner_id: UUID REFERENCES users(id), -- Always set, cannot be null
  name: TEXT,
  ...
}

-- Team collaboration (flexible membership system)
organization_members: {
  user_id: UUID REFERENCES users(id),
  organization_id: UUID REFERENCES organizations(organization_id),
  role: TEXT -- 'owner', 'admin', 'member'
  PRIMARY KEY (user_id, organization_id)
}
```

### Access Control Logic
```
User can access organization IF:
  1. user_id = organizations.owner_id (direct ownership)
  OR
  2. EXISTS in organization_members with organization_id (team membership)
```

## Implementation Rules

### 1. User Creation (handle_new_user)
```sql
-- ALWAYS create both records
INSERT INTO organizations (owner_id, name) VALUES (user_id, name);
INSERT INTO organization_members (user_id, organization_id, role) VALUES (user_id, org_id, 'owner');
```

### 2. API Authorization 
```typescript
// Check ownership FIRST (faster, guaranteed)
const ownedOrg = await supabase
  .from('organizations')
  .select('*')
  .eq('organization_id', orgId)
  .eq('owner_id', userId)
  .single();

if (ownedOrg) return ownedOrg;

// Fallback to membership check
const memberOrg = await supabase
  .from('organizations')
  .select('*, organization_members!inner(*)')
  .eq('organization_members.user_id', userId)
  .eq('organization_id', orgId)
  .single();

return memberOrg;
```

### 3. Organization Transfer
```sql
-- Update owner_id AND ensure new owner is in members
UPDATE organizations SET owner_id = new_user_id WHERE organization_id = org_id;
INSERT INTO organization_members (user_id, organization_id, role) 
VALUES (new_user_id, org_id, 'owner')
ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner';
```

### 4. Member Management
- **Adding members**: Only add to `organization_members`
- **Removing members**: Remove from `organization_members` (but owner_id stays)
- **Role changes**: Update `organization_members.role`

## Benefits of This Approach

### ✅ Advantages
1. **Guaranteed Ownership**: Organizations always have an owner (billing, legal)
2. **Team Flexibility**: Easy to add/remove team members
3. **Performance**: Owner checks are fast (direct FK lookup)
4. **Data Integrity**: Cannot orphan organizations
5. **Scalable Permissions**: Easy to add more roles
6. **Industry Standard**: Similar to GitHub, Vercel, Stripe

### 🔧 Maintenance Requirements
1. **Consistent Creation**: Always create both records
2. **Repair Function**: Fix missing memberships automatically
3. **Migration Scripts**: Handle existing inconsistent data

## Comparison with Other Models

### Pure Ownership Model (too simple)
- **GitHub Personal**: Only for single-user scenarios
- **Pros**: Simple
- **Cons**: No team collaboration, hard to scale

### Pure Membership Model (too complex)
- **Discord/Slack**: Chat-focused, different use case
- **Pros**: Very flexible
- **Cons**: Can orphan organizations, complex ownership transfer

### Hybrid Model (our choice)
- **Vercel/Railway/Stripe**: B2B SaaS standard
- **Pros**: Best of both worlds
- **Cons**: Requires careful implementation

## Implementation Checklist

### Database Level
- [x] `handle_new_user` creates both records
- [x] Foreign key constraints
- [x] Indexes on both owner_id and organization_members

### API Level  
- [x] Authorization checks both ownership and membership
- [x] Repair endpoints for inconsistent data
- [x] Proper error handling

### Frontend Level
- [x] Organization selector handles both access methods
- [x] Graceful degradation for missing data
- [x] Auto-repair on detected inconsistencies

### Monitoring
- [ ] Database constraint monitoring
- [ ] Orphaned organization detection
- [ ] Membership consistency alerts

## Best Practices

### 1. Always Use Transactions
```sql
BEGIN;
  INSERT INTO organizations (...);
  INSERT INTO organization_members (...);
COMMIT;
```

### 2. Defensive Programming
```typescript
// Always check both access methods
const hasAccess = await checkOwnership(userId, orgId) || 
                  await checkMembership(userId, orgId);
```

### 3. Regular Consistency Checks
```sql
-- Find organizations without owner memberships
SELECT o.organization_id, o.owner_id 
FROM organizations o
LEFT JOIN organization_members om ON (
  om.user_id = o.owner_id AND 
  om.organization_id = o.organization_id
)
WHERE om.user_id IS NULL;
```

## Migration Strategy

### For Existing Data
1. **Audit**: Find inconsistent records
2. **Repair**: Add missing memberships  
3. **Validate**: Ensure all organizations have owner memberships
4. **Monitor**: Set up ongoing consistency checks

### Code Example
```sql
-- Repair missing owner memberships
INSERT INTO organization_members (user_id, organization_id, role)
SELECT DISTINCT o.owner_id, o.organization_id, 'owner'
FROM organizations o
LEFT JOIN organization_members om ON (
  om.user_id = o.owner_id AND 
  om.organization_id = o.organization_id
)
WHERE om.user_id IS NULL;
``` 