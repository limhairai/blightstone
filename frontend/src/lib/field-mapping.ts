/**
 * Utility functions for converting between camelCase (frontend) and snake_case (database)
 * This implements the AdHub approach for clean separation of concerns
 */

// Convert camelCase to snake_case
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// Convert snake_case to camelCase
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// Convert object keys from camelCase to snake_case
export function objectToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key)
    // Special handling for competitor level field
    if (snakeKey === 'level' && typeof value === 'string') {
      result[snakeKey] = value.toLowerCase()
    } else {
      result[snakeKey] = value
    }
  }
  
  return result
}

// Convert object keys from snake_case to camelCase
export function objectToCamelCase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key)
    // Special handling for competitor level field - convert back to title case
    if (key === 'level' && typeof value === 'string') {
      result[camelKey] = value.charAt(0).toUpperCase() + value.slice(1)
    } 
    // Handle nested arrays (like child_tasks)
    else if (Array.isArray(value)) {
      result[camelKey] = value.map(item => 
        typeof item === 'object' && item !== null ? objectToCamelCase(item) : item
      )
    }
    // Handle nested objects
    else if (typeof value === 'object' && value !== null) {
      result[camelKey] = objectToCamelCase(value)
    }
    else {
      result[camelKey] = value
    }
  }
  
  return result
}

// Convert array of objects from camelCase to snake_case
export function arrayToSnakeCase<T extends Record<string, any>>(arr: T[]): Record<string, any>[] {
  return arr.map(obj => objectToSnakeCase(obj))
}

// Convert array of objects from snake_case to camelCase
export function arrayToCamelCase<T extends Record<string, any>>(arr: T[]): Record<string, any>[] {
  return arr.map(obj => objectToCamelCase(obj))
}

// Specific field mappings for complex cases
export const FIELD_MAPPINGS = {
  // Frontend camelCase -> Database snake_case
  TO_DB: {
    projectId: 'project_id',
    userId: 'user_id',
    createdBy: 'created_by',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    dueDate: 'due_date',
    ageGenderLocation: 'age_gender_location',
    dailyStruggles: 'daily_struggles',
    desiredCharacteristics: 'desired_characteristics',
    desiredSocialStatus: 'desired_social_status',
    productHelpAchieveStatus: 'product_help_achieve_status',
    beliefsToOvercome: 'beliefs_to_overcome',
    failedSolutions: 'failed_solutions',
    marketAwareness: 'market_awareness',
    marketSophistication: 'market_sophistication',
    deeperPainPoints: 'deeper_pain_points',
    hiddenSpecificDesires: 'hidden_specific_desires',
    dominoStatement: 'domino_statement',
    websiteUrl: 'website_url',
    adLibraryLink: 'ad_library_link',
    offerUrl: 'offer_url',
    trafficVolume: 'traffic_volume',
    launchDate: 'launch_date',
    adConcept: 'ad_concept',
    testHypothesis: 'test_hypothesis',
    adType: 'ad_type',
    adVariable: 'ad_variable',
    hookPattern: 'hook_pattern',
    winningAdLink: 'winning_ad_link',
    briefLink: 'brief_link',
    driveLink: 'drive_link',
    // Child task fields
    parentTaskId: 'parent_task_id',
    childCount: 'child_count',
    completedChildCount: 'completed_child_count',
    childTasks: 'child_tasks',
  },
  // Database snake_case -> Frontend camelCase
  TO_FRONTEND: {
    project_id: 'projectId',
    user_id: 'userId',
    created_by: 'createdBy',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    due_date: 'dueDate',
    age_gender_location: 'ageGenderLocation',
    daily_struggles: 'dailyStruggles',
    desired_characteristics: 'desiredCharacteristics',
    desired_social_status: 'desiredSocialStatus',
    product_help_achieve_status: 'productHelpAchieveStatus',
    beliefs_to_overcome: 'beliefsToOvercome',
    failed_solutions: 'failedSolutions',
    market_awareness: 'marketAwareness',
    market_sophistication: 'marketSophistication',
    deeper_pain_points: 'deeperPainPoints',
    hidden_specific_desires: 'hiddenSpecificDesires',
    domino_statement: 'dominoStatement',
    website_url: 'websiteUrl',
    ad_library_link: 'adLibraryLink',
    offer_url: 'offerUrl',
    traffic_volume: 'trafficVolume',
    launch_date: 'launchDate',
    ad_concept: 'adConcept',
    test_hypothesis: 'testHypothesis',
    ad_type: 'adType',
    ad_variable: 'adVariable',
    hook_pattern: 'hookPattern',
    winning_ad_link: 'winningAdLink',
    brief_link: 'briefLink',
    drive_link: 'driveLink',
    // Child task fields
    parent_task_id: 'parentTaskId',
    child_count: 'childCount',
    completed_child_count: 'completedChildCount',
    child_tasks: 'childTasks',
  }
} as const

// Convert object using specific field mappings
export function mapFieldsToDatabase<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const dbKey = FIELD_MAPPINGS.TO_DB[key as keyof typeof FIELD_MAPPINGS.TO_DB] || key
    result[dbKey] = value
  }
  
  return result
}

// Convert object using specific field mappings
export function mapFieldsToFrontend<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const frontendKey = FIELD_MAPPINGS.TO_FRONTEND[key as keyof typeof FIELD_MAPPINGS.TO_FRONTEND] || key
    result[frontendKey] = value
  }
  
  return result
}

// Convert array using specific field mappings
export function mapArrayToDatabase<T extends Record<string, any>>(arr: T[]): Record<string, any>[] {
  return arr.map(obj => mapFieldsToDatabase(obj))
}

// Convert array using specific field mappings
export function mapArrayToFrontend<T extends Record<string, any>>(arr: T[]): Record<string, any>[] {
  return arr.map(obj => mapFieldsToFrontend(obj))
}