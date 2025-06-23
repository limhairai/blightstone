"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { LinkIcon, Users, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ApplicationBindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onBind: (data: { teamId: string; businessManagerId: string }) => Promise<void>;
}

export function ApplicationBindingDialog({
  open,
  onOpenChange,
  applicationId,
  onBind,
}: ApplicationBindingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedBusinessManager, setSelectedBusinessManager] = useState("");

  // Mock data for teams and business managers
  const teams = [
    { id: "team-1", name: "Team Alpha", capacity: "15/20", status: "active" },
    { id: "team-2", name: "Team Beta", capacity: "19/20", status: "at_capacity" },
    { id: "team-3", name: "Team Gamma", capacity: "12/20", status: "active" },
  ];

  const businessManagers = [
    { id: "bm-1", name: "TechCorp BM", bmId: "123456789", status: "available" },
    { id: "bm-2", name: "Digital Pro BM", bmId: "987654321", status: "available" },
    { id: "bm-3", name: "E-commerce BM", bmId: "456789123", status: "assigned" },
  ];

  const availableBusinessManagers = businessManagers.filter(bm => bm.status === "available");

  const handleBind = async () => {
    if (!selectedTeam || !selectedBusinessManager) {
      toast.error("Please select both a team and business manager");
      return;
    }

    try {
      setIsSubmitting(true);
      await onBind({
        teamId: selectedTeam,
        businessManagerId: selectedBusinessManager,
      });
      toast.success("Application bound successfully!");
      onOpenChange(false);
      setSelectedTeam("");
      setSelectedBusinessManager("");
    } catch (error) {
      console.error("Error binding application:", error);
      toast.error("Failed to bind application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-purple-600" />
            Bind Application to Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">Assignment Overview</span>
            </div>
            <div className="text-sm text-purple-800 dark:text-purple-200">
              <p>This will assign the application to a specific team and business manager for processing.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-select">Select Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id} disabled={team.status === "at_capacity"}>
                      <div className="flex items-center justify-between w-full">
                        <span>{team.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant={team.status === "active" ? "default" : "secondary"} className="text-xs">
                            {team.capacity}
                          </Badge>
                          {team.status === "at_capacity" && (
                            <Badge variant="destructive" className="text-xs">Full</Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bm-select">Select Business Manager</Label>
              <Select value={selectedBusinessManager} onValueChange={setSelectedBusinessManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a business manager..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBusinessManagers.map((bm) => (
                    <SelectItem key={bm.id} value={bm.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{bm.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{bm.bmId}</div>
                        </div>
                        <Badge variant="outline" className="text-xs ml-2">
                          <Shield className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTeam && selectedBusinessManager && (
            <div className="p-4 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">Assignment Summary</span>
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                <p>
                  <strong>Team:</strong> {teams.find(t => t.id === selectedTeam)?.name}
                </p>
                <p>
                  <strong>Business Manager:</strong> {businessManagers.find(bm => bm.id === selectedBusinessManager)?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleBind} 
            disabled={isSubmitting || !selectedTeam || !selectedBusinessManager}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <LinkIcon className="h-4 w-4 mr-2 animate-spin" />
                Binding...
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                Bind Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 