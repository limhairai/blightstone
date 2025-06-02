import { Button } from "@/components/ui/button"

export function QuickActions({ org }: { org: any }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="bg-[#b19cd9] text-black hover:bg-[#9f84ca]">
        Edit
      </Button>
      <Button variant="outline" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
        Archive
      </Button>
      <Button variant="outline" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
        Invite User
      </Button>
      {/* TODO: Implement action handlers for edit, archive, invite */}
    </div>
  )
} 