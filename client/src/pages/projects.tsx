import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ProjectModal } from "@/components/project-modal";
import { PhaseModal } from "@/components/phase-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  FolderOpen
} from "lucide-react";
import { format } from "date-fns";
import { type ProjectWithPhases, type Phase } from "@shared/schema";

export default function Projects() {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithPhases | null>(null);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deletePhaseId, setDeletePhaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<ProjectWithPhases[]>({
    queryKey: ["/api/projects"],
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      setDeleteProjectId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
      console.error("Delete project error:", error);
    },
  });

  const deletePhaseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/phases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Phase deleted successfully",
      });
      setDeletePhaseId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete phase",
        variant: "destructive",
      });
      console.error("Delete phase error:", error);
    },
  });

  const handleEditProject = (project: ProjectWithPhases) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleAddPhase = (projectId: string) => {
    setSelectedProjectId(projectId);
    setEditingPhase(null);
    setShowPhaseModal(true);
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setSelectedProjectId(null);
    setShowPhaseModal(true);
  };

  const handleCloseProjectModal = () => {
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleClosePhaseModal = () => {
    setShowPhaseModal(false);
    setEditingPhase(null);
    setSelectedProjectId(null);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.client && project.client.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const config = {
      completed: { variant: "default" as const, className: "bg-success text-success-foreground" },
      in_progress: { variant: "default" as const, className: "bg-warning text-warning-foreground" },
      delayed: { variant: "destructive" as const, className: "" },
      pending: { variant: "secondary" as const, className: "" },
    };
    
    return config[status as keyof typeof config] || config.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'in_progress': return <Clock className="h-3 w-3" />;
      case 'delayed': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your projects and phases</p>
          </div>
          <Button onClick={() => setShowProjectModal(true)} data-testid="add-project-button">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
        
        {/* Search */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search projects..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-projects"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "No projects match your search." : "Get started by creating your first project."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowProjectModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow" data-testid={`project-card-${project.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      {project.client && (
                        <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`project-menu-${project.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddPhase(project.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Phase
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteProjectId(project.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Project Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(project.startDate), "MMM dd")} - {format(new Date(project.endDate), "MMM dd")}</span>
                    </div>
                    <Badge 
                      variant={getStatusBadge(project.status).variant}
                      className={getStatusBadge(project.status).className}
                    >
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Phases */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">Phases ({project.phases?.length || 0})</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAddPhase(project.id)}
                        data-testid={`add-phase-${project.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {project.phases && project.phases.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {project.phases.map((phase) => (
                          <div 
                            key={phase.id} 
                            className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                            data-testid={`phase-${phase.id}`}
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {getStatusIcon(phase.status)}
                              <span className="text-xs font-medium truncate">{phase.name}</span>
                              <Badge 
                                variant={getStatusBadge(phase.status).variant}
                                className={`${getStatusBadge(phase.status).className} text-xs`}
                              >
                                {phase.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditPhase(phase)}
                                data-testid={`edit-phase-${phase.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDeletePhaseId(phase.id)}
                                data-testid={`delete-phase-${phase.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">No phases yet</p>
                      </div>
                    )}
                  </div>

                  {/* Team Members */}
                  {project.phases && project.phases.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {Array.from(new Set(project.phases.filter(p => p.assignee).map(p => p.assignee!.name))).length} team members
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectModal
        open={showProjectModal}
        onClose={handleCloseProjectModal}
        project={editingProject}
      />

      <PhaseModal
        open={showPhaseModal}
        onClose={handleClosePhaseModal}
        phase={editingPhase}
        projectId={selectedProjectId}
      />

      {/* Delete Project Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone and will also delete all associated phases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectId && deleteProjectMutation.mutate(deleteProjectId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Phase Dialog */}
      <AlertDialog open={!!deletePhaseId} onOpenChange={() => setDeletePhaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this phase? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePhaseId && deletePhaseMutation.mutate(deletePhaseId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePhaseMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
