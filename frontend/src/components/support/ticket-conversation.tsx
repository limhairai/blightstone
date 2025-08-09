"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Send, 
  User, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Info,
  X,
  Building2,
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  SupportTicket, 
  SupportMessage, 
  TICKET_STATUSES,
  TICKET_CATEGORIES
} from '@/types/support'
import { formatRelativeTime } from '@/utils/format'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TicketConversationProps {
  ticket: SupportTicket
  onTicketUpdate?: (ticket: SupportTicket) => void
  onClose?: () => void
  isAdminPanel?: boolean
}

export function TicketConversation({ ticket, onTicketUpdate, onClose, isAdminPanel = false }: TicketConversationProps) {
  const { user, session } = useAuth()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if current user is admin
  const isAdmin = user?.user_metadata?.is_superuser === true || isAdminPanel

  // Fetch ticket messages
  useEffect(() => {
    if (ticket.id && session?.access_token) {
      fetchMessages()
    }
  }, [ticket.id, session?.access_token])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    if (!session?.access_token) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/support/tickets/${ticket.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !session?.access_token) return

    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}`
    
    // ⚡ INSTANT: Create optimistic message immediately
    const optimisticMessage: SupportMessage = {
      id: tempId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isInternal: false,
      messageType: 'message',
      sender: {
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.email || 'You',
        email: session.user.email || '',
        isAdmin: isAdminPanel
      },
      ticketId: ticket.id,
      sending: true // Mark as sending for UI feedback
    }

    // ⚡ INSTANT: Add message to UI immediately
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    
    // ⚡ INSTANT: Update ticket info immediately
    if (onTicketUpdate) {
      onTicketUpdate({
        ...ticket,
        messageCount: (ticket.messageCount || 0) + 1,
        lastMessageAt: new Date().toISOString(),
        lastMessageContent: messageContent
      })
    }

    try {
      setSending(true)
      
      const response = await fetch(`/api/support/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          isInternal: false,
          messageType: 'message',
          sentFromAdmin: isAdminPanel
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Send message error:', response.status, errorText)
        throw new Error(`Failed to send message: ${response.status} ${errorText}`)
      }

      const newMsg = await response.json()
      const messageData = newMsg.message || newMsg
      
      // ⚡ REPLACE: Update optimistic message with real data
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...messageData, sending: false }
          : msg
      ))
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // ⚡ ERROR HANDLING: Mark message as failed, allow retry
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, sending: false, failed: true }
          : msg
      ))
      
      toast.error('Failed to send message. Click to retry.')
    } finally {
      setSending(false)
    }
  }

  const updateTicketStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      const updatedTicket = await response.json()
      if (onTicketUpdate) {
        onTicketUpdate({ ...ticket, status: status as any })
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Failed to update ticket status')
    }
  }

  const getStatusIcon = (status: string) => {
    const config = TICKET_STATUSES[status as keyof typeof TICKET_STATUSES]
    if (!config) return <AlertCircle className="h-4 w-4" />
    const Icon = config.icon
    return <Icon className="h-4 w-4" />
  }

  const getStatusConfig = (status: string) => {
    return TICKET_STATUSES[status as keyof typeof TICKET_STATUSES] || { label: status, icon: AlertCircle }
  }

  const getMessageAvatar = (message: SupportMessage) => {
    // Only treat as admin message if it was actually sent from admin panel
    const isAdminMessage = message.metadata?.sent_from_admin === true
    
    if (isAdminMessage) {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/adhub-icon.png" alt="Blightstone Support" />
          <AvatarFallback className="bg-primary text-white text-xs font-semibold">
            AH
          </AvatarFallback>
        </Avatar>
      )
    }
    
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
    )
  }

  const isCurrentUser = (message: SupportMessage) => {
    return message.senderId === user?.id
  }

  const getMessageDisplayInfo = (message: SupportMessage) => {
    // Only treat as admin message if it was actually sent from admin panel
    const isAdminMessage = message.metadata?.sent_from_admin === true
    const isFromCurrentUser = message.senderId === user?.id
    
    if (isAdminMessage) {
      return {
        displayName: 'Blightstone Support',
        isAdmin: true,
        alignRight: false // Admin messages always align left
      }
    }
    
    return {
      displayName: message.sender?.name || 'Unknown',
      isAdmin: false,
      alignRight: isFromCurrentUser && !isAdminPanel // Client messages align right only in client panel
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(ticket.status)}
            <h2 className="font-semibold text-sm">#{ticket.ticketNumber}</h2>
            <Badge variant="secondary" className="text-xs">
              {getStatusConfig(ticket.status).label}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {ticket.subject}
          </div>
          {isAdminPanel && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>Org: {ticket.organizationId?.slice(0, 8)}...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isAdminPanel && (
            <>
              <Select 
                value={ticket.status} 
                onValueChange={(value) => updateTicketStatus(value)}
              >
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TICKET_STATUSES).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-xs text-muted-foreground">
                {formatRelativeTime(ticket.createdAt)}
              </div>
            </>
          )}
          
          {!isAdminPanel && (
            <div className="text-xs text-muted-foreground">
              {formatRelativeTime(ticket.createdAt)}
            </div>
          )}
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages - Intercom Style */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isFromCurrentUser = isCurrentUser(message)
              const messageInfo = getMessageDisplayInfo(message)
              const currentMessageIsAdmin = message.metadata?.sent_from_admin === true
              const previousMessageIsAdmin = index > 0 ? messages[index - 1]?.metadata?.sent_from_admin === true : false
              const showAvatar = index === 0 || currentMessageIsAdmin !== previousMessageIsAdmin
              
              return (
                <div key={message.id} className={`flex gap-3 ${messageInfo.alignRight ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                    {getMessageAvatar(message)}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`flex-1 max-w-[70%] ${messageInfo.alignRight ? 'text-right' : ''}`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1 ${messageInfo.alignRight ? 'flex-row-reverse' : ''}`}>
                        <span className="text-sm font-medium text-foreground">
                          {messageInfo.displayName}
                        </span>
                        {messageInfo.isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            Support Team
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`rounded-2xl px-4 py-2 inline-block max-w-full relative ${
                      messageInfo.alignRight 
                        ? message.failed 
                          ? 'bg-destructive/20 text-destructive border border-destructive/30' 
                          : message.sending
                            ? 'bg-primary/70 text-primary-foreground' 
                            : 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      
                      {/* ⚡ INSTANT FEEDBACK: Sending/Failed indicators */}
                      {message.sending && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-background rounded-full flex items-center justify-center border">
                          <div className="w-1.5 h-1.5 bg-muted rounded-full animate-pulse" />
                        </div>
                      )}
                      
                      {message.failed && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-background rounded-full flex items-center justify-center border border-destructive">
                          <AlertCircle className="w-2 h-2 text-destructive" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Intercom Style */}
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message... (Enter to send)"
              className="border-muted focus:border-primary"
              disabled={sending}
              onKeyDown={(e) => {
                // ⚡ INSTANT: Ctrl/Cmd + Enter for sending (like Telegram)
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleSendMessage(e as any)
                }
              }}
            />
          </div>
          <Button 
            type="submit" 
            size="sm"
            disabled={!newMessage.trim() || sending}
            className="bg-primary hover:bg-primary/90"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
} 