"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useDebounce } from 'use-debounce'
import useSWR from 'swr'
import { authenticatedFetcher } from '@/lib/swr-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Search, 
  Plus, 
  Filter, 
  MessageSquare, 
  Clock, 
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { CreateTicketDialog } from '@/components/support/create-ticket-dialog'
import { TicketConversation } from '@/components/support/ticket-conversation'
import { 
  SupportTicket, 
  TicketFilters, 
  TicketsResponse,
  TICKET_CATEGORIES,
  TICKET_STATUSES
} from '@/types/support'
import { formatRelativeTime } from '@/utils/format'

export default function SupportPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  
  // State management
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Debounce search query to prevent excessive API calls
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)

  // Build query parameters
  const queryParams = useMemo(() => {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)
    if (debouncedSearchQuery) params.append('search', debouncedSearchQuery)
    return params.toString()
  }, [statusFilter, categoryFilter, debouncedSearchQuery])

  // ⚡ INSTANT LOADING: Use prefetched data for 0ms page load
  const { data: ticketsData, error, isLoading, mutate } = useSWR(
    session?.access_token ? [`/api/support/tickets?${queryParams}`, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes - much longer since we prefetch
      revalidateIfStale: false, // Use cached data immediately
      revalidateOnMount: false, // Don't fetch on mount, use cache
      fallbackData: [], // Provide empty fallback to prevent loading states
    }
  )

  const tickets = ticketsData?.tickets || []
  const loading = isLoading

  // Auto-select first ticket when tickets load
  useEffect(() => {
    if (!selectedTicket && tickets.length > 0) {
      setSelectedTicket(tickets[0])
    }
  }, [tickets, selectedTicket])

  // Handlers
  const handleTicketCreated = (newTicket: SupportTicket) => {
    // Optimistically update the cache
    mutate()
    setSelectedTicket(newTicket)
    setCreating(false)
    toast.success('Ticket created successfully')
  }

  const handleTicketUpdated = (updatedTicket: SupportTicket) => {
    // Optimistic update
    const optimisticData = {
      tickets: tickets.map((ticket: any) => 
      ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    }
    mutate(optimisticData, false)
    
    if (selectedTicket?.id === updatedTicket.id) {
      setSelectedTicket(updatedTicket)
    }
    
    // Revalidate
    mutate()
  }

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toString().includes(searchQuery) ||
      (ticket.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <div className="h-[calc(100vh-7rem)] rounded-lg border border-border overflow-hidden">
      {/* Main Content */}
      <div className="h-full flex">
        {/* Left Sidebar - Ticket List */}
        <div className="w-80 border-r border-border flex flex-col bg-card">
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
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setCreating(true)}
                      className="h-8 px-2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create new ticket</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                filteredTickets.map((ticket: any) => (
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
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                            <span>
                              {TICKET_CATEGORIES[ticket.category as keyof typeof TICKET_CATEGORIES]?.label || ticket.category}
                            </span>
                          </div>
                          

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
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {selectedTicket ? (
            <TicketConversation 
              ticket={selectedTicket} 
              isAdminPanel={false}
              onTicketUpdate={(updatedTicket) => {
                // Optimistic update
                const optimisticData = {
                  tickets: tickets.map((t: any) => 
                  t.id === updatedTicket.id ? updatedTicket : t
                  )
                }
                mutate(optimisticData, false)
                mutate() // Revalidate
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
                <Button 
                  onClick={() => setCreating(true)}
                  className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Ticket
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <CreateTicketDialog 
        open={creating} 
        onOpenChange={setCreating}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  )
} 