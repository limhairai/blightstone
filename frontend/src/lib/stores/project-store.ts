import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Project {
  id: string
  name: string
  description: string
  status: "active" | "paused" | "completed"
  tasksCount: number
  completedTasks: number
  createdAt: string
  lastActivity: string
}

interface ProjectStore {
  currentProjectId: string | null
  projects: Project[]
  setCurrentProjectId: (id: string) => void
  getCurrentProject: () => Project | null
  addProject: (project: Project) => void
}

// Mock projects data
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Grounding.co Campaign",
    description: "Complete marketing campaign for grounding products including creative assets, customer research, and competitor analysis",
    status: "active",
    tasksCount: 12,
    completedTasks: 8,
    createdAt: "2025-01-08",
    lastActivity: "2 hours ago"
  },
  {
    id: "2", 
    name: "Brand X Product Launch",
    description: "New product launch campaign with full market research and creative development",
    status: "active",
    tasksCount: 8,
    completedTasks: 3,
    createdAt: "2025-01-07",
    lastActivity: "1 day ago"
  },
  {
    id: "3",
    name: "Wellness Blog Content",
    description: "Content marketing strategy and blog post creation",
    status: "paused",
    tasksCount: 5,
    completedTasks: 2,
    createdAt: "2025-01-05",
    lastActivity: "3 days ago"
  }
]

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentProjectId: "1", // Default to first project
      projects: mockProjects,
      
      setCurrentProjectId: (id: string) => {
        set({ currentProjectId: id })
      },
      
      getCurrentProject: () => {
        const { currentProjectId, projects } = get()
        return projects.find(p => p.id === currentProjectId) || null
      },
      
      addProject: (project: Project) => {
        set(state => ({
          projects: [...state.projects, project]
        }))
      }
    }),
    {
      name: 'blightstone-project-store'
    }
  )
)