import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Phase } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertTriangle, Circle } from "lucide-react";

interface PhaseStatusModalProps {
  open: boolean;
  onClose: () => void;
  phase: Phase | null;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: Circle, color: 'text-muted-foreground' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-warning' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-success' },
  { value: 'delayed', label: 'Delayed', icon: AlertTriangle, color: 'text-destructive' },
] as const;

export function PhaseStatusModal({ open, onClose, phase }: PhaseStatusModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!phase) return;
      return await apiRequest("PATCH", `/api/phases/${phase.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      toast({
        title: "Success",
        description: "Phase status updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update phase status",
        variant: "destructive",
      });
      console.error("Update phase status error:", error);
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  if (!phase) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="phase-status-modal">
        <DialogHeader>
          <DialogTitle>Update Phase Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Phase Name</div>
            <div className="text-lg font-semibold">{phase.name}</div>
          </div>

          <div>
            <div className="text-sm font-medium mb-3">Select Status</div>
            <div className="grid grid-cols-2 gap-3">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isActive = phase.status === option.value;
                
                return (
                  <Button
                    key={option.value}
                    variant={isActive ? "default" : "outline"}
                    className={`h-auto py-4 flex flex-col items-center space-y-2 ${
                      !isActive ? option.color : ''
                    }`}
                    onClick={() => handleStatusChange(option.value)}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`status-option-${option.value}`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm">{option.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {phase.notes && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
              <div className="text-sm">{phase.notes}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
