import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Loading component for admin panels
const AdminPanelSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)

// Lazy-loaded admin components with loading states
export const LazyAdminApplications = dynamic(
  () => import('@/app/admin/applications/page'),
  {
    loading: () => <AdminPanelSkeleton />,
    ssr: false
  }
)

export const LazyAdminOrganizations = dynamic(
  () => import('@/app/admin/organizations/page'),
  {
    loading: () => <AdminPanelSkeleton />,
    ssr: false
  }
)

export const LazyAdminTransactions = dynamic(
  () => import('@/app/admin/transactions/history/page'),
  {
    loading: () => <AdminPanelSkeleton />,
    ssr: false
  }
)

export const LazyAdminAssets = dynamic(
  () => import('@/app/admin/assets/page'),
  {
    loading: () => <AdminPanelSkeleton />,
    ssr: false
  }
)

export const LazyAdminSupport = dynamic(
  () => import('@/app/admin/support/page'),
  {
    loading: () => <AdminPanelSkeleton />,
    ssr: false
  }
)

export const LazyAdminAnalytics = dynamic(
  () => import('@/app/admin/analytics/page'),
  {
    loading: () => <AdminPanelSkeleton />,
    ssr: false
  }
)

export const LazyAdminTeams = dynamic(
  () => import('@/app/admin/teams/page'),
  {
    loading: () => <AdminPanelSkeleton />,
    ssr: false
  }
)

// Lazy-loaded admin components (individual components)
export const LazyAccessCodeManager = dynamic(
  () => import('@/components/admin/AccessCodeManager'),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false
  }
)

export const LazyBindAssetDialog = dynamic(
  () => import('@/components/admin/BindAssetDialog').then(mod => ({ default: mod.BindAssetDialog })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false
  }
)

export const LazyManageAssetDialog = dynamic(
  () => import('@/components/admin/ManageAssetDialog').then(mod => ({ default: mod.ManageAssetDialog })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false
  }
)

// Chart components (heavy dependencies) - removed as admin-charts doesn't exist
// export const LazyAdminCharts = dynamic(
//   () => import('@/components/admin/admin-charts'),
//   {
//     loading: () => <Skeleton className="h-64 w-full" />,
//     ssr: false
//   }
// )

// Table components with heavy data processing
export const LazyAdminBusinessesTable = dynamic(
  () => import('@/components/dashboard/admin-businesses-table').then(mod => ({ default: mod.BusinessesTable })),
  {
    loading: () => <AdminPanelSkeleton />,
    ssr: false
  }
)

export { AdminPanelSkeleton } 