# 🏆 Team Management System

## Overview

The Team Management System enables you to organize your Dolphin profiles and assets by teams, making it easy to identify which anti-detect browser profiles to use for each asset and handle profile switching for failover scenarios.

## 🏗️ Team Structure

### Naming Convention
```
{TEAM}-{ROLE}-{INSTANCE}
```

**Examples:**
- `A-Admin-1` - Team A, Primary Admin profile
- `A-Backup-1` - Team A, First backup profile  
- `A-Backup-2` - Team A, Second backup profile
- `B-Admin-1` - Team B, Primary Admin profile

### Team Rules
- **Only ONE profile per team connected to Dolphin at any time**
- **Admin profiles** are the primary profiles (currently active)
- **Backup profiles** exist in anti-detect browser but are NOT connected to Dolphin
- **Backup profiles** are only connected when needed for failover

## 🎯 Implementation

### 1. Team Extraction Logic
```typescript
// Extract team info from profile name
function extractTeamFromProfile(profileName: string): TeamInfo | null {
  const match = profileName.match(/^([A-Z]+)-(Admin|Backup)-(\d+)$/);
  if (match) {
    return {
      team: match[1],        // "A", "B", "C"
      role: match[2],        // "Admin", "Backup" 
      instance: match[3],    // "1", "2"
      isBackup: match[2] === 'Backup'
    };
  }
  return null;
}
```

### 2. Asset Team Assignment
- **Profiles**: Team extracted directly from profile name
- **Business Managers**: Team extracted from managing profile
- **Ad Accounts**: Team extracted from managing profile

### 3. Assets Page Enhancements

#### New Features Added:
- ✅ **Team Column** - Shows which team each asset belongs to
- ✅ **Team Filter** - Filter assets by team (A, B, C, etc.)
- ✅ **Team Badges** - Visual indicators with team colors
- ✅ **Profile Role Display** - Shows Admin/Backup status for profiles

#### Table Structure:
```
| Asset Name    | Status | Team   | Role      | Actions |
|---------------|--------|--------|-----------|---------|
| A-Admin-1     | Active | Team A | Admin-1   | -       |
| AdHub-BM      | Active | Team A | -         | Bind    |
| Ad Account 1  | Active | Team A | -         | Bind    |
```

## 🔄 Profile Switching (Failover)

### When A-Admin-1 Goes Down
1. **Disconnect** A-Admin-1 from Dolphin Cloud
2. **Connect** A-Backup-1 to Dolphin Cloud
3. **Run sync** - Same assets will appear, just from different profile
4. **App continues normally** - All bindings and client assignments preserved

### Backend Support
- ✅ **Profile Switch Endpoint**: `/api/dolphin-assets/handle-profile-switch`
- ✅ **Team Validation**: Ensures switching within same team only
- ✅ **Asset Metadata Update**: Updates profile references while preserving bindings
- ✅ **Audit Trail**: Tracks all profile switches with timestamps

### API Usage:
```bash
POST /api/dolphin-assets/handle-profile-switch
{
  "old_profile_name": "A-Admin-1",
  "new_profile_name": "A-Backup-1"
}
```

## 🎨 UI Features

### Team Badges
- **Team A, B, C**: Blue badges with team identifier
- **Admin Profiles**: Green badges indicating primary status
- **Backup Profiles**: Orange badges indicating backup status
- **Unknown**: Gray badges for unrecognized patterns

### Filtering
- **All Teams**: Show all assets
- **Team A**: Show only Team A assets
- **Team B**: Show only Team B assets
- **Dynamic**: Automatically detects available teams

## 🔧 Technical Implementation

### Files Modified:
- ✅ `frontend/src/app/admin/assets/page.tsx` - Enhanced assets page
- ✅ `frontend/src/lib/team-utils.ts` - Team utility functions
- ✅ `backend/app/api/endpoints/dolphin_assets.py` - Profile switching endpoint
- ✅ `backend/app/api/endpoints/dolphin_assets.py` - Fixed BM name vs business name

### Key Functions:
- `extractTeamFromProfile()` - Parse team info from profile names
- `getTeamFromAssetMetadata()` - Get team from asset metadata
- `getTeamDisplayName()` - Format team names consistently
- `handle_profile_switch()` - Backend profile switching logic

## 🚀 Benefits

### 1. **Easy Asset Identification**
- See which team each asset belongs to at a glance
- Know exactly which anti-detect browser profiles to use

### 2. **Risk Management**
- Only one profile per team exposed at any time
- Clean failover process when profiles go down

### 3. **Operational Efficiency**
- Filter assets by team for focused management
- Clear visual indicators for profile roles

### 4. **Robust Architecture**
- Client bindings tied to Facebook IDs, not profile names
- Profile switching doesn't break existing assignments
- Full audit trail for all profile changes

## 📋 Usage Examples

### Daily Operations
1. **View Team A assets**: Filter by "Team A" in assets page
2. **Find anti-detect profile**: See "Team A" → use A-Admin-1 in browser
3. **Handle failover**: If A-Admin-1 fails, switch to A-Backup-1

### Profile Management
```bash
# Current active profiles in Dolphin:
A-Admin-1  (Team A - Primary)
B-Admin-1  (Team B - Primary)
C-Admin-1  (Team C - Primary)

# Backup profiles in anti-detect browser (not connected):
A-Backup-1, A-Backup-2  (Team A backups)
B-Backup-1, B-Backup-2  (Team B backups)
C-Backup-1, C-Backup-2  (Team C backups)
```

## 🔮 Future Enhancements

### Possible Additions:
- **Team Dashboard**: Overview of all teams and their status
- **Automated Failover**: Detect profile failures and auto-switch
- **Team Performance Metrics**: Track spend and performance by team
- **Profile Health Monitoring**: Monitor profile connection status

---

The Team Management System provides a robust foundation for organizing your Dolphin assets by teams while maintaining operational flexibility and risk management. The system is designed to handle profile switching seamlessly without disrupting client services. 