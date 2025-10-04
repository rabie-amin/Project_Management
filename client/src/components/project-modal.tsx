import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type InsertProject } from "@shared/schema";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, Plus } from "lucide-react";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
}

interface PhaseForm {
  name: string;
  assigneeId: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const projectFormSchema = insertProjectSchema;

export function ProjectModal({ open, onClose }: ProjectModalProps) {
  const [phases, setPhases] = useState<PhaseForm[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertProject & { phases?: PhaseForm[] }>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      client: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      status: "active",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { project: InsertProject, phases: PhaseForm[] }) => {
      const projectResponse = await apiRequest("POST", "/api/projects", data.project);
      const project = await projectResponse.json();
      
      if (data.phases.length > 0) {
        await Promise.all(
          data.phases.map((phase, index) => 
            apiRequest("POST", "/api/phases", {
              projectId: project.id,
              name: phase.name,
              assigneeId: phase.assigneeId || null,
              startDate: new Date(phase.startDate),
              endDate: new Date(phase.endDate),
              notes: phase.notes || null,
              order: index,
              status: 'pending',
            })
          )
        );
      }
      
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      onClose();
      form.reset();
      setPhases([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
      console.error("Create project error:", error);
    },
  });

  const onSubmit = (data: InsertProject & { phases?: PhaseForm[] }) => {
    const { phases: _, ...projectData } = data;
    createProjectMutation.mutate({ project: projectData, phases });
  };

  const addPhase = () => {
    setPhases([...phases, {
      name: "",
      assigneeId: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    }]);
  };

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, field: keyof PhaseForm, value: string) => {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    setPhases(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="project-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Project
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter project name" 
                      {...field} 
                      data-testid="input-project-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter client name" 
                      {...field} 
                      value={field.value || ""}
                      data-testid="input-project-client"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        data-testid="input-project-start-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        data-testid="input-project-end-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter project description"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      data-testid="input-project-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phases Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <FormLabel>Project Phases</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhase}
                  data-testid="button-add-phase"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Phase
                </Button>
              </div>

              <div className="space-y-3">
                {phases.map((phase, index) => (
                  <div key={index} className="bg-muted/30 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Phase {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePhase(index)}
                        data-testid={`button-remove-phase-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <FormLabel className="text-xs">Phase Name</FormLabel>
                        <Input
                          placeholder="e.g., Discovery"
                          value={phase.name}
                          onChange={(e) => updatePhase(index, 'name', e.target.value)}
                          data-testid={`input-phase-name-${index}`}
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-xs">Assignee ID</FormLabel>
                        <Input
                          placeholder="Enter assignee ID"
                          value={phase.assigneeId}
                          onChange={(e) => updatePhase(index, 'assigneeId', e.target.value)}
                          data-testid={`input-phase-assignee-${index}`}
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-xs">Start Date</FormLabel>
                        <Input
                          type="date"
                          value={phase.startDate}
                          onChange={(e) => updatePhase(index, 'startDate', e.target.value)}
                          data-testid={`input-phase-start-date-${index}`}
                        />
                      </div>
                      
                      <div>
                        <FormLabel className="text-xs">End Date</FormLabel>
                        <Input
                          type="date"
                          value={phase.endDate}
                          onChange={(e) => updatePhase(index, 'endDate', e.target.value)}
                          data-testid={`input-phase-end-date-${index}`}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <FormLabel className="text-xs">Notes</FormLabel>
                        <Input
                          placeholder="Additional notes"
                          value={phase.notes}
                          onChange={(e) => updatePhase(index, 'notes', e.target.value)}
                          data-testid={`input-phase-notes-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-project"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProjectMutation.isPending}
                data-testid="button-submit-project"
              >
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
