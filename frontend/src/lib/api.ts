import { createBrowserClient } from '@supabase/ssr'
import type { Task, Project, AdAccount, Offer, File, Folder } from './stores/project-store'

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
  async getByProject(projectId: string, statusFilter?: string): Promise<Task[]> {
    try {
      let url = `${API_BASE}/tasks?projectId=${projectId}`
      if (statusFilter) {
        url += `&status=${statusFilter}`
      }
      const response = await fetchWithAuth(url)
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
  },

  // Child task methods
  async getChildren(parentId: string, statusFilter?: string): Promise<Task[]> {
    try {
      console.log('Fetching child tasks for parent:', parentId)
      
      // First try the dedicated children route
      try {
        let url = `${API_BASE}/tasks/${parentId}/children`
        if (statusFilter) {
          url += `?status=${statusFilter}`
        }
        console.log('Trying dedicated route:', url)
        const response = await fetchWithAuth(url)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Child tasks fetched via dedicated route')
          return data.childTasks || []
        }
        
        console.log('Dedicated route failed with status:', response.status)
      } catch (routeError) {
        console.log('Dedicated route error:', routeError)
      }
      
      console.log('Dedicated route failed, returning empty array')
      return []
    } catch (error) {
      console.error('Error fetching child tasks:', error)
      // Don't throw error, return empty array to prevent UI from breaking
      return []
    }
  },

  async createChild(parentId: string, childTask: Partial<Task>): Promise<Task> {
    try {
      console.log('Creating child task for parent:', parentId)
      
      // First try the dedicated children route
      try {
        console.log('Trying dedicated route:', `${API_BASE}/tasks/${parentId}/children`)
        const response = await fetchWithAuth(`${API_BASE}/tasks/${parentId}/children`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(childTask)
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Child task created via dedicated route')
          return data.childTask
        }
        
        console.log('Dedicated route failed with status:', response.status)
      } catch (routeError) {
        console.log('Dedicated route error:', routeError)
      }
      
      // Fallback: Use main tasks route with parentTaskId
      console.log('Falling back to main tasks route')
      const response = await fetchWithAuth(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...childTask,
          parentTaskId: parentId
        })
      })
      
      console.log('Fallback response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Child task creation failed:', errorData)
        throw new Error(`Failed to create child task: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Child task created via fallback route')
      return data.task
    } catch (error) {
      console.error('Error creating child task:', error)
      throw error
    }
  }
}

// Personas API
export const personasApi = {
  async getByProject(projectId: string) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/personas?projectId=${projectId}`)
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
  async getByProject(projectId: string) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/competitors?projectId=${projectId}`)
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
  async getByProject(projectId: string) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creatives?projectId=${projectId}`)
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
  async getByProject(projectId: string) {
    try {
      const response = await fetchWithAuth(`${API_BASE}/creative-intelligence?projectId=${projectId}`)
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

// Ad Accounts API
export const adAccountsApi = {
  async getByProject(projectId: string): Promise<AdAccount[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/ad-accounts?projectId=${projectId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch ad accounts')
      }
      const data = await response.json()
      return data.adAccounts || []
    } catch (error) {
      console.error('Error fetching ad accounts:', error)
      throw error
    }
  },

  async create(adAccount: { name: string; businessManager: string; projectId: string }): Promise<AdAccount> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/ad-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adAccount)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create ad account')
      }
      const data = await response.json()
      return data.adAccount
    } catch (error) {
      console.error('Error creating ad account:', error)
      throw error
    }
  },

  async update(id: string, adAccount: Partial<AdAccount>): Promise<AdAccount> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/ad-accounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...adAccount })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update ad account')
      }
      const data = await response.json()
      return data.adAccount
    } catch (error) {
      console.error('Error updating ad account:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/ad-accounts?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete ad account')
      }
    } catch (error) {
      console.error('Error deleting ad account:', error)
      throw error
    }
  }
}

// Offers API
export const offersApi = {
  async getByProject(projectId: string): Promise<Offer[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/offers?projectId=${projectId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch offers')
      }
      const data = await response.json()
      return data.offers || []
    } catch (error) {
      console.error('Error fetching offers:', error)
      throw error
    }
  },

  async create(offer: { name: string; price: string; url?: string; description?: string; projectId: string }): Promise<Offer> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create offer')
      }
      const data = await response.json()
      return data.offer
    } catch (error) {
      console.error('Error creating offer:', error)
      throw error
    }
  },

  async update(id: string, offer: Partial<Offer>): Promise<Offer> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/offers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...offer })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update offer')
      }
      const data = await response.json()
      return data.offer
    } catch (error) {
      console.error('Error updating offer:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/offers?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete offer')
      }
    } catch (error) {
      console.error('Error deleting offer:', error)
      throw error
    }
  }
}

// Files API
export const filesApi = {
  async getAll(filters?: {
    projectId?: string
    offerId?: string
    adAccountId?: string
    category?: string
  }): Promise<File[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.projectId) params.append('project_id', filters.projectId)
      if (filters?.offerId) params.append('offer_id', filters.offerId)
      if (filters?.adAccountId) params.append('ad_account_id', filters.adAccountId)
      if (filters?.category) params.append('category', filters.category)
      
      const url = `${API_BASE}/files${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetchWithAuth(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching files:', error)
      throw error
    }
  },

  async upload(formData: FormData): Promise<File> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/files/upload`, {
        method: 'POST',
        body: formData // Don't set Content-Type, let browser set it for multipart/form-data
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload file')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  },

  async update(id: string, updates: Partial<File>): Promise<File> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/files`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...updates })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update file')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating file:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/files?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  },

  async getSignedUrl(filePath: string): Promise<string> {
    try {
      console.log('Getting signed URL for path:', filePath)
      
      // This would typically be a separate endpoint, but for now we can use Supabase directly
      const { data, error } = await supabase.storage
        .from('files')
        .createSignedUrl(filePath, 3600) // 1 hour expiry
      
      if (error) {
        console.error('Supabase storage error:', error)
        throw error
      }
      
      console.log('Signed URL data:', data)
      return data?.signedUrl || ''
    } catch (error) {
      console.error('Error getting signed URL:', error)
      throw error
    }
  }
}

// Folders API
export const foldersApi = {
  async getAll(projectId: string): Promise<Folder[]> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/folders?project_id=${projectId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch folders')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching folders:', error)
      throw error
    }
  },

  async create(folderData: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(folderData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create folder')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error creating folder:', error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Folder>): Promise<Folder> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/folders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...updates })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update folder')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating folder:', error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`${API_BASE}/folders?id=${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete folder')
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  }
}