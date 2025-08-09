import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  assignee: string
  dueDate: string
  createdAt: string
  category: string
  projectId: string
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
  notes: string
  projectId: string
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
}

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
  tasks: Task[]
  customerAvatars: CustomerAvatar[]
  competitors: Competitor[]
  creativeTrackers: CreativeTracker[]
  
  setCurrentProjectId: (id: string) => void
  getCurrentProject: () => Project | null
  addProject: (project: Project) => void
  
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

// Mock project-specific data
const mockTasks: Task[] = [
  // Grounding.co Campaign tasks
  {
    id: "1",
    title: "Create customer avatar for Persona 1 (Catherine)",
    description: "Develop detailed customer avatar including pain points, desires, and objections for the mom persona",
    status: "in-progress",
    priority: "high",
    assignee: "You",
    dueDate: "2025-01-10",
    createdAt: "2025-01-08",
    category: "Research",
    projectId: "1"
  },
  {
    id: "2",
    title: "Design video ad creative for grounding sheets",
    description: "Create video ad focusing on sleep improvement benefits, targeting problem-aware customers",
    status: "todo",
    priority: "medium",
    assignee: "Designer",
    dueDate: "2025-01-12",
    createdAt: "2025-01-08",
    category: "Creative",
    projectId: "1"
  },
  {
    id: "3",
    title: "Research top 5 competitors pricing strategies",
    description: "Analyze competitor pricing, positioning, and unique selling propositions",
    status: "completed",
    priority: "medium",
    assignee: "You",
    dueDate: "2025-01-09",
    createdAt: "2025-01-07",
    category: "Research",
    projectId: "1"
  },
  // Brand X Product Launch tasks
  {
    id: "4",
    title: "Develop Brand X positioning strategy",
    description: "Define unique value proposition and market positioning",
    status: "in-progress",
    priority: "high",
    assignee: "Strategy Team",
    dueDate: "2025-01-11",
    createdAt: "2025-01-07",
    category: "Strategy",
    projectId: "2"
  },
  {
    id: "5",
    title: "Create Brand X customer personas",
    description: "Research and develop detailed customer personas for Brand X",
    status: "todo",
    priority: "high",
    assignee: "Research Team",
    dueDate: "2025-01-13",
    createdAt: "2025-01-07",
    category: "Research",
    projectId: "2"
  }
]

const mockCustomerAvatars: CustomerAvatar[] = [
  // Grounding.co Campaign avatars
  {
    id: "1",
    name: "Catherine (Mom)",
    type: "Persona 1",
    age: "35-60",
    gender: "Female",
    location: "United States",
    struggles: ["Bad Sleeper", "Stress", "Headache And Migraine"],
    characteristics: ["Caring person", "Organized", "Health-Conscious", "Thoughtful", "Reliable"],
    statusDesired: ["Recognized for her ability to balance family, work, and personal life seamlessly"],
    productHelp: ["Restful sleep and reduced stress help her manage family life with ease"],
    beliefs: ["Natural remedies take too long to work", "Grounding products are complicated to use"],
    failedSolutions: ["Sleep supplements: Left her groggy in the morning"],
    awareness: "Problem Aware",
    sophistication: "Low to Medium",
    insecurities: ["Worried about being perceived as a tired, overwhelmed mom"],
    mindset: "Catherine juggles multiple responsibilities daily—work, home, and family. She's always 'on,' and her to-do list feels endless.",
    painPoints: ["Feeling exhausted and unable to give her best to her family"],
    desires: ["To wake up feeling energized and ready to take on the day"],
    objections: ["Will this really improve my sleep, or is it just another gimmick?"],
    projectId: "1"
  },
  // Brand X Product Launch avatars
  {
    id: "2",
    name: "Alex (Professional)",
    type: "Persona 1",
    age: "28-45",
    gender: "Non-binary",
    location: "Urban Areas",
    struggles: ["Work Stress", "Time Management", "Health Maintenance"],
    characteristics: ["Ambitious", "Tech-savvy", "Health-conscious", "Busy"],
    statusDesired: ["Recognized as a high-performing professional"],
    productHelp: ["Helps maintain energy and focus during busy workdays"],
    beliefs: ["Quick solutions don't work long-term"],
    failedSolutions: ["Energy drinks: Caused crashes later"],
    awareness: "Solution Aware",
    sophistication: "High",
    insecurities: ["Fear of falling behind professionally"],
    mindset: "Alex is focused on career growth while trying to maintain a healthy lifestyle.",
    painPoints: ["Struggling to balance work demands with personal health"],
    desires: ["To maintain peak performance without sacrificing health"],
    objections: ["Is this just another wellness trend?"],
    projectId: "2"
  }
]

const mockCompetitors: Competitor[] = [
  // Grounding.co Campaign competitors
  {
    id: "1",
    name: "Earthing Harmony",
    website: "https://earthingharmony.eu/",
    market: "Worldwide",
    level: "High",
    pricing: "$89-199",
    strengths: ["Strong European presence", "High-quality materials"],
    weaknesses: ["Higher price point", "Limited US marketing"],
    positioning: "Premium wellness brand focused on natural healing",
    targetAudience: "Health-conscious Europeans, wellness enthusiasts",
    marketShare: "15%",
    notes: "Main competitor in European market. Strong brand recognition.",
    projectId: "1"
  },
  {
    id: "2",
    name: "GroundingWell",
    website: "https://www.groundingwell.com/",
    market: "USA",
    level: "High",
    pricing: "$79-159",
    strengths: ["Modern branding", "Strong social media presence"],
    weaknesses: ["Limited product range", "Newer brand with less trust"],
    positioning: "Modern wellness brand for sleep optimization",
    targetAudience: "Millennials, sleep-focused consumers",
    marketShare: "12%",
    notes: "Growing rapidly through digital marketing. Direct competitor.",
    projectId: "1"
  },
  // Brand X Product Launch competitors
  {
    id: "3",
    name: "Wellness Pro",
    website: "https://wellnesspro.com/",
    market: "USA",
    level: "Medium",
    pricing: "$50-120",
    strengths: ["Professional focus", "B2B partnerships"],
    weaknesses: ["Limited consumer marketing", "Complex product line"],
    positioning: "Professional wellness solutions",
    targetAudience: "Working professionals, corporate wellness",
    marketShare: "8%",
    notes: "Focuses on workplace wellness. Different positioning angle.",
    projectId: "2"
  }
]

const mockCreativeTrackers: CreativeTracker[] = [
  // Grounding.co Campaign trackers
  {
    id: "1",
    batch: "Batch 001",
    brand: "Grounding.co",
    status: "in-progress",
    launchDate: "2025-01-10",
    adConcept: "Problem-aware messaging for sleep issues",
    adType: "Video + Static",
    adVariable: "Hook variation",
    desire: "Better sleep naturally",
    benefit: "Improved sleep quality without medication",
    objections: "Skeptical about grounding effectiveness",
    persona: "Persona 1 - Catherine (Mom)",
    positioning: "Natural sleep solution for busy moms",
    positioningHow: "Position as easy-to-use bedtime routine",
    hookPattern: "Problem → Agitation → Solution",
    results: "CTR: 2.3%, CPC: $0.85",
    winningAds: "Video #1 performing best",
    briefLink: "",
    projectId: "1"
  },
  {
    id: "2", 
    batch: "Batch 002",
    brand: "Grounding.co",
    status: "completed",
    launchDate: "2025-01-08",
    adConcept: "Pain relief messaging for back pain",
    adType: "Static + Carousel",
    adVariable: "Benefit focus",
    desire: "Pain-free mobility",
    benefit: "Reduced back pain and muscle tension",
    objections: "Doubt about lasting results",
    persona: "Persona 2 - John (Dad)",
    positioning: "Recovery solution for active dads",
    positioningHow: "Position as performance enhancement tool",
    hookPattern: "Before/After transformation",
    results: "CTR: 3.1%, CPC: $0.72, 15 sales",
    winningAds: "Static #2 best performer",
    briefLink: "",
    projectId: "1"
  },
  // Brand X Product Launch trackers
  {
    id: "3",
    batch: "Batch 001",
    brand: "Brand X",
    status: "planned",
    launchDate: "2025-01-12",
    adConcept: "Professional wellness positioning",
    adType: "Video",
    adVariable: "Professional angle",
    desire: "Peak performance",
    benefit: "Maintain energy and focus during busy workdays",
    objections: "Is this just another wellness trend?",
    persona: "Alex (Professional)",
    positioning: "Performance enhancement for professionals",
    positioningHow: "Position as productivity tool",
    hookPattern: "Problem → Solution → Results",
    results: "Pending launch",
    winningAds: "TBD",
    briefLink: "",
    projectId: "2"
  }
]

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentProjectId: "1", // Default to first project
      projects: mockProjects,
      tasks: mockTasks,
      customerAvatars: mockCustomerAvatars,
      competitors: mockCompetitors,
      creativeTrackers: mockCreativeTrackers,
      
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