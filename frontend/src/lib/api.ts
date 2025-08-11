import { createBrowserClient } from '@supabase/ssr'
import type { Task, Project } from './stores/project-store'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// API base URL for our custom routes
const API_BASE = '/api'

// Helper function for authenticated API calls
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include'
  })
}

// Projects API
export const projectsApi = {
  async getAll(): Promise<Project[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/projects`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch projects')
      }
      const data = await response.json()
      return data.projects || []
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw error
    }
  },

  async create(project: { name: string; description?: string; status?: string; user_id?: string; created_by?: string }): Promise<Project> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }
      const data = await response.json()
      return data.project
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  },

  async delete(projectId: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/projects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }
}

// Tasks API
export const tasksApi = {
  async getAll(): Promise<Task[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/tasks`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      return data.tasks || []
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  },

  async create(task: Partial<Task>): Promise<Task> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      })
      if (!response.ok) throw new Error('Failed to create task')
      const data = await response.json()
      return data.task
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      if (!response.ok) throw new Error('Failed to update task')
      const data = await response.json()
      return data.task
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/tasks?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete task')
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }
}

// Personas API
export const personasApi = {
  async getAll() {
    try {
      const response = await fetchWithAuth(`${API_BASE}/personas`)
      if (!response.ok) throw new Error('Failed to fetch personas')
      const data = await response.json()
      return data.personas || []
    } catch (error) {
      console.error('Error fetching personas:', error)
      throw error
    }
  },

  async create(persona: any) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/personas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona)
      })
      if (!response.ok) throw new Error('Failed to create persona')
      const data = await response.json()
      return data.persona
    } catch (error) {
      console.error('Error creating persona:', error)
      throw error
    }
  },

  async update(id: string, persona: any) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/personas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...persona })
      })
      if (!response.ok) throw new Error('Failed to update persona')
      const data = await response.json()
      return data.persona
    } catch (error) {
      console.error('Error updating persona:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/personas?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete persona')
    } catch (error) {
      console.error('Error deleting persona:', error)
      throw error
    }
  }
}

// Competitors API
export const competitorsApi = {
  async getAll() {
    try {
      const response = await fetchWithAuth(`${API_BASE}/competitors`)
      if (!response.ok) throw new Error('Failed to fetch competitors')
      const data = await response.json()
      return data.competitors || []
    } catch (error) {
      console.error('Error fetching competitors:', error)
      throw error
    }
  },

  async create(competitor: any) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitor)
      })
      if (!response.ok) throw new Error('Failed to create competitor')
      const data = await response.json()
      return data.competitor
    } catch (error) {
      console.error('Error creating competitor:', error)
      throw error
    }
  },

  async update(id: string, competitor: any) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/competitors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...competitor })
      })
      if (!response.ok) throw new Error('Failed to update competitor')
      const data = await response.json()
      return data.competitor
    } catch (error) {
      console.error('Error updating competitor:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/competitors?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete competitor')
    } catch (error) {
      console.error('Error deleting competitor:', error)
      throw error
    }
  }
}

// Creatives API
export const creativesApi = {
  async getAll() {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creatives`)
      if (!response.ok) throw new Error('Failed to fetch creatives')
      const data = await response.json()
      return data.creatives || []
    } catch (error) {
      console.error('Error fetching creatives:', error)
      throw error
    }
  },

  async create(creative: any) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creative)
      })
      if (!response.ok) throw new Error('Failed to create creative')
      const data = await response.json()
      return data.creative
    } catch (error) {
      console.error('Error creating creative:', error)
      throw error
    }
  },

  async update(id: string, creative: any) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creatives?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creative)
      })
      if (!response.ok) throw new Error('Failed to update creative')
      const data = await response.json()
      return data.creative
    } catch (error) {
      console.error('Error updating creative:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creatives?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete creative')
    } catch (error) {
      console.error('Error deleting creative:', error)
      throw error
    }
  }
}

// Creative Intelligence API
export const creativeIntelligenceApi = {
  async getAll() {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creative-intelligence`)
      if (!response.ok) throw new Error('Failed to fetch creative intelligence')
      const data = await response.json()
      return data.creatives || []
    } catch (error) {
      console.error('Error fetching creative intelligence:', error)
      throw error
    }
  },

  async create(creative: any) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creative-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creative)
      })
      if (!response.ok) throw new Error('Failed to create creative')
      const data = await response.json()
      return data.creative
    } catch (error) {
      console.error('Error creating creative:', error)
      throw error
    }
  },

  async update(id: string, creative: any) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creative-intelligence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...creative })
      })
      if (!response.ok) throw new Error('Failed to update creative')
      const data = await response.json()
      return data.creative
    } catch (error) {
      console.error('Error updating creative:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creative-intelligence?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete creative')
    } catch (error) {
      console.error('Error deleting creative:', error)
      throw error
    }
  }
}

// Team API
export const teamApi = {
  async getAll() {
    try {
      const response = await fetchWithAuth(`${API_BASE}/team`)
      if (!response.ok) throw new Error('Failed to fetch team members')
      const data = await response.json()
      return data.teamMembers || []
    } catch (error) {
      console.error('Error fetching team members:', error)
      throw error
    }
  }
}