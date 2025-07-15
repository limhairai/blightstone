// Support ticket system types

import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  CreditCard,
  Shield,
  FileText,
  Building2,
  Circle
} from 'lucide-react'

export interface SupportTicket {
  id: string
  ticketNumber: number
  subject: string
  status: TicketStatus
  organizationId: string
  organizationName?: string
  creator?: {
    id: string
    name?: string
    email?: string
  }
  category: TicketCategory
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  lastMessageAt?: string
  lastMessageContent?: string
  messageCount?: number
  isUnread?: boolean
  assignee?: {
    id: string
    name: string
    email: string
  }
}

export interface SupportMessage {
  id: string
  message_id: string
  ticketId: string
  senderId: string
  content: string
  isInternal: boolean
  messageType: 'message' | 'status_change' | 'assignment' | 'note'
  createdAt: string
  editedAt?: string
  readByCustomer: boolean
  readByAdmin: boolean
  metadata?: {
    sent_from_admin?: boolean
    sent_from_admin_panel?: boolean
  }
  sender?: {
    name: string
    email: string
    role: string
  }
  senderName?: string
  senderType?: 'admin' | 'user'
  attachments?: Array<{
    id: string
    filename: string
    url: string
    size: number
  }>
}

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'

export interface CreateTicketRequest {
  subject: string
  category: string
  message: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface UpdateTicketRequest {
  subject?: string
  category?: TicketCategory
  status?: TicketStatus
  assigneeId?: string
}

export interface TicketFilters {
  status?: TicketStatus | 'all'
  category?: TicketCategory | 'all'
  search?: string
}

export interface TicketsResponse {
  tickets: SupportTicket[]
  total: number
  page: number
  limit: number
}

export interface Asset {
  id: string
  name: string
  type: 'business_manager' | 'ad_account'
}

export interface CreateTicketData {
  subject: string
  category: TicketCategory
  initialMessage: string
  affectedAssetIds?: string[]
}

// Category display configuration
export const TICKET_CATEGORIES = {
  ad_account_issue: {
    label: 'Ad Account Issue',
    description: 'Problems with ad account functionality',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: CreditCard
  },
  business_manager_issue: {
    label: 'Business Manager Issue', 
    description: 'Problems with business manager access or functionality',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: Building2
  },
  pixel_access_request: {
    label: 'Pixel Access Request',
    description: 'Request access to Facebook pixels',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: Shield
  },
  billing_question: {
    label: 'Billing Question',
    description: 'Questions about billing, payments, or subscriptions',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: CreditCard
  },
  account_access_issue: {
    label: 'Account Access Issue',
    description: 'Problems with account login or access',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: User
  },
  feature_request: {
    label: 'Feature Request',
    description: 'Suggestions for new features or improvements',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: FileText
  },
  bug_report: {
    label: 'Bug Report',
    description: 'Report technical issues or bugs',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: AlertCircle
  },
  general_inquiry: {
    label: 'General Inquiry',
    description: 'General questions or support requests',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: FileText
  }
} as const

export type TicketCategory = keyof typeof TICKET_CATEGORIES

export const TICKET_PRIORITIES = {
  low: { label: 'Low', variant: 'secondary' as const },
  medium: { label: 'Medium', variant: 'default' as const },
  high: { label: 'High', variant: 'destructive' as const },
  urgent: { label: 'Urgent', variant: 'destructive' as const },
} as const

// Status display configuration
export const TICKET_STATUSES = {
  open: { 
    label: 'Open', 
    variant: 'default' as const,
    color: 'bg-muted text-muted-foreground border-muted', 
    icon: Circle 
  },
  in_progress: { 
    label: 'In Progress', 
    variant: 'secondary' as const,
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    icon: Clock 
  },
  resolved: { 
    label: 'Resolved', 
    variant: 'outline' as const,
    color: 'bg-green-50 text-green-700 border-green-200', 
    icon: CheckCircle 
  },
  closed: { 
    label: 'Closed', 
    variant: 'secondary' as const,
    color: 'bg-gray-50 text-gray-700 border-gray-200', 
    icon: XCircle 
  },
} as const 