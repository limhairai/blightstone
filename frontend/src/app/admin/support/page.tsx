"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Search, 
  MessageSquare, 
  Clock, 
  User,
  UserCheck,
  Building2,
  CreditCard,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { TicketConversation } from '@/components/support/ticket-conversation'
import { formatRelativeTime } from '@/utils/format'
import { 
  SupportTicket, 
  TICKET_CATEGORIES,
  TICKET_STATUSES
} from '@/types/support'

export default function AdminSupportPage() {
  const { session } = useAuth()
  
  // State management
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [creating, setCreating] = useState(false)

  // Fetch tickets
  useEffect(() => {
    if (session?.access_token) {
      fetchTickets()
    }
  }, [session])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/support/tickets', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }

      const data = await response.json()
      setTickets(data.tickets || [])
      
      // If no ticket is selected, select the first one
      if (!selectedTicket && data.tickets.length > 0) {
        setSelectedTicket(data.tickets[0])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update ticket')
      }

      // Refresh tickets
      fetchTickets()
      toast.success('Ticket status updated')
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket status')
    }
  }

  // Handle ticket updates
  const handleTicketUpdated = (updatedTicket: SupportTicket) => {
    setTickets(prev => prev.map(t => 
      t.id === updatedTicket.id ? updatedTicket : t
    ))
    setSelectedTicket(updatedTicket)
  }

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toString().includes(searchQuery) ||
      ticket.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.creator?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Ticket List */}
        <div className="w-80 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="relative flex-1 mr-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCreating(true)}
                className="h-8 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(TICKET_STATUSES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(TICKET_CATEGORIES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No tickets found</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTicket?.id === ticket.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Left Side - Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            #{ticket.id.slice(-6)}
                          </span>
                          <Badge 
                            variant={TICKET_STATUSES[ticket.status as keyof typeof TICKET_STATUSES]?.variant || 'default'} 
                            className="text-xs px-1.5 py-0.5"
                          >
                            {TICKET_STATUSES[ticket.status as keyof typeof TICKET_STATUSES]?.label || ticket.status}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-sm mb-1 truncate">
                          {ticket.subject}
                        </h4>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{ticket.organizationName}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                            <span>
                              {TICKET_CATEGORIES[ticket.category as keyof typeof TICKET_CATEGORIES]?.label || ticket.category}
                            </span>
                          </div>
                          
                          {ticket.priority && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-1.5 py-0.5"
                            >
                              {ticket.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Right Side - Time */}
                      <div className="flex flex-col items-end gap-1 ml-3">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(ticket.lastMessageAt || ticket.createdAt)}
                        </span>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          <span>{ticket.messageCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedTicket ? (
            <TicketConversation 
              ticket={selectedTicket} 
              isAdminPanel={true}
              onTicketUpdate={(updatedTicket) => {
                setTickets(prev => prev.map(t => 
                  t.id === updatedTicket.id ? updatedTicket : t
                ))
                setSelectedTicket(updatedTicket)
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a ticket from the list to view the conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 