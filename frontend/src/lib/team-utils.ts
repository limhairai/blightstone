export interface TeamInfo {
  team: string
  role: string
  instance: string
  isBackup: boolean
}

/**
 * Extract team information from profile name
 * @param profileName - Profile name like "A-Admin-1" or "B-Backup-2"
 * @returns TeamInfo object or null if pattern doesn't match
 */
export function extractTeamFromProfile(profileName: string): TeamInfo | null {
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

/**
 * Get team identifier from profile name
 * @param profileName - Profile name like "A-Admin-1"
 * @returns Team identifier like "A" or "Unknown"
 */
export function getTeamFromProfile(profileName: string): string {
  const teamInfo = extractTeamFromProfile(profileName);
  return teamInfo ? teamInfo.team : 'Unknown';
}

/**
 * Check if two profiles belong to the same team
 * @param profile1 - First profile name
 * @param profile2 - Second profile name
 * @returns true if both profiles belong to the same team
 */
export function isSameTeam(profile1: string, profile2: string): boolean {
  const team1 = getTeamFromProfile(profile1);
  const team2 = getTeamFromProfile(profile2);
  return team1 !== 'Unknown' && team2 !== 'Unknown' && team1 === team2;
}

/**
 * Get display name for team
 * @param teamLetter - Team letter like "A", "B", "C"
 * @returns Display name like "Team A"
 */
export function getTeamDisplayName(teamLetter: string): string {
  return teamLetter === 'Unknown' ? 'Unknown' : `Team ${teamLetter}`;
}

/**
 * Get team information from asset metadata
 * @param assetMetadata - Asset metadata object
 * @returns Team identifier or "Unknown"
 */
export function getTeamFromAssetMetadata(assetMetadata: any): string {
  // Try to get team from managing profile
  const managingProfile = assetMetadata?.managing_profiles?.[0]?.name || 
                         assetMetadata?.managing_profile;
  
  if (managingProfile) {
    return getTeamFromProfile(managingProfile);
  }
  
  return 'Unknown';
}

/**
 * Generate profile names for a team
 * @param teamLetter - Team letter like "A", "B", "C"
 * @param backupCount - Number of backup profiles (default: 2)
 * @returns Array of profile names
 */
export function generateTeamProfileNames(teamLetter: string, backupCount: number = 2): string[] {
  const profiles = [`${teamLetter}-Admin-1`];
  
  for (let i = 1; i <= backupCount; i++) {
    profiles.push(`${teamLetter}-Backup-${i}`);
  }
  
  return profiles;
}

/**
 * Get the primary (Admin) profile for a team
 * @param teamLetter - Team letter like "A", "B", "C"
 * @returns Primary profile name like "A-Admin-1"
 */
export function getPrimaryProfile(teamLetter: string): string {
  return `${teamLetter}-Admin-1`;
}

/**
 * Get backup profiles for a team
 * @param teamLetter - Team letter like "A", "B", "C"
 * @param backupCount - Number of backup profiles (default: 2)
 * @returns Array of backup profile names
 */
export function getBackupProfiles(teamLetter: string, backupCount: number = 2): string[] {
  const backups = [];
  for (let i = 1; i <= backupCount; i++) {
    backups.push(`${teamLetter}-Backup-${i}`);
  }
  return backups;
} 