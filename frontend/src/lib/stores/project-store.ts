import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createBrowserClient } from '@supabase/ssr'
import { projectsApi, personasApi, competitorsApi, creativesApi } from '@/lib/api'

// Performance optimization: Debounce function for search/filter operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// API client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

export interface TaskLink {
  id: string
  title: string
  url: string
  description?: string
  addedAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  assignee: string
  due_date: string
  created_at: string
  category: string
  project_id: string
  created_by?: string
  notes?: string
  attachments?: TaskAttachment[]
  links?: TaskLink[]
}

export interface CustomerAvatar {
  id: string
  name: string
  type: string
  age: string
  gender: string
  location: string
  struggles: string[]
  characteristics: string[]
  statusDesired: string[]
  productHelp: string[]
  beliefs: string[]
  failedSolutions: string[]
  awareness: string
  sophistication: string
  insecurities: string[]
  mindset: string
  painPoints: string[]
  desires: string[]
  objections: string[]
  projectId: string
  createdBy?: string
}

export interface Competitor {
  id: string
  name: string
  website: string
  market: string
  level: "Poor" | "Medium" | "High"
  pricing: string
  strengths: string[]
  weaknesses: string[]
  positioning: string
  targetAudience: string
  marketShare: string
  notes?: string
  projectId: string
  createdBy?: string
  adLibraryLink?: string
  offerUrl?: string
  trafficVolume?: string
}

export interface CreativeTracker {
  id: string
  batch: string
  brand: string
  status: "planned" | "in-progress" | "completed" | "paused"
  launchDate: string
  adConcept: string
  adType: string
  adVariable: string
  desire: string
  benefit: string
  objections: string
  persona: string
  positioning: string
  positioningHow: string
  hookPattern: string
  results: string
  winningAds: string
  briefLink: string
  projectId: string
  createdBy?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: "active" | "paused" | "completed"
  user_id?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  // Computed fields (not stored in DB)
  tasksCount?: number
  completedTasks?: number
  createdAt?: string // Legacy field for compatibility
  lastActivity?: string // Legacy field for compatibility
}

interface ProjectStore {
  currentProjectId: string | null
  projects: Project[]
  tasks: Task[]
  customerAvatars: CustomerAvatar[]
  competitors: Competitor[]
  creativeTrackers: CreativeTracker[]
  
  setCurrentProjectId: (id: string) => void
  getCurrentProject: () => Project | null
  addProject: (project: Project) => void
  loadProjects: () => Promise<void>
  getProjectWithDynamicCounts: (projectId: string) => Project | null
  
  // Task methods
  getTasksForProject: (projectId: string) => Task[]
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  
  // Customer Avatar methods
  getAvatarsForProject: (projectId: string) => CustomerAvatar[]
  addAvatar: (avatar: CustomerAvatar) => void
  
  // Competitor methods
  getCompetitorsForProject: (projectId: string) => Competitor[]
  addCompetitor: (competitor: Competitor) => void
  
  // Creative Tracker methods
  getCreativeTrackersForProject: (projectId: string) => CreativeTracker[]
  addCreativeTracker: (tracker: CreativeTracker) => void
}

// Production ready - no mock data, will load from API

// Production ready - tasks loaded from API




export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentProjectId: null, // No default project - will load from API
      projects: [],
      tasks: [],
      customerAvatars: [],
      competitors: [],
      creativeTrackers: [],
      
      setCurrentProjectId: (id: string) => {
        set({ currentProjectId: id })
      },
      
      getCurrentProject: () => {
        const { currentProjectId, projects } = get()
        return projects.find(p => p.id === currentProjectId) || null
      },
      
      getProjectWithDynamicCounts: (projectId: string) => {
        const { projects, tasks } = get()
        const project = projects.find(p => p.id === projectId)
        if (!project) return null
        
        const projectTasks = tasks.filter(task => task.projectId === projectId)
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length
        
        return {
          ...project,
          tasksCount: projectTasks.length,
          completedTasks: completedTasks
        }
      },
      
      addProject: (project: Project) => {
        set(state => ({
          projects: [...state.projects, project]
        }))
      },
      
      loadProjects: async () => {
        try {
          const projects = await projectsApi.getAll()
          set({ projects })
        } catch (error) {
          console.error('Error loading projects:', error)
        }
      },
      
      // Task methods
      getTasksForProject: (projectId: string) => {
        const { tasks } = get()
        return tasks.filter(task => task.projectId === projectId)
      },
      
      addTask: (task: Task) => {
        set(state => ({
          tasks: [...state.tasks, task]
        }))
      },
      
      updateTask: (taskId: string, updates: Partial<Task>) => {
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        }))
      },
      
      // Customer Avatar methods
      getAvatarsForProject: (projectId: string) => {
        const { customerAvatars } = get()
        return customerAvatars.filter(avatar => avatar.projectId === projectId)
      },
      
      addAvatar: (avatar: CustomerAvatar) => {
        set(state => ({
          customerAvatars: [...state.customerAvatars, avatar]
        }))
      },
      
      // Competitor methods
      getCompetitorsForProject: (projectId: string) => {
        const { competitors } = get()
        return competitors.filter(competitor => competitor.projectId === projectId)
      },
      
      addCompetitor: (competitor: Competitor) => {
        set(state => ({
          competitors: [...state.competitors, competitor]
        }))
      },
      
      // Creative Tracker methods
      getCreativeTrackersForProject: (projectId: string) => {
        const { creativeTrackers } = get()
        return creativeTrackers.filter(tracker => tracker.projectId === projectId)
      },
      
      addCreativeTracker: (tracker: CreativeTracker) => {
        set(state => ({
          creativeTrackers: [...state.creativeTrackers, tracker]
        }))
      }
    }),
    {
      name: 'blightstone-project-store'
    }
  )
)