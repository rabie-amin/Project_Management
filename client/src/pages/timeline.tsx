import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Timeline } from "@/components/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  X
} from "lucide-react";
import { format } from "date-fns";
import { type ProjectWithPhases } from "@shared/schema";

interface FilterState {
  status: string;
  assignee: string;
  project: string;
}

export default function TimelinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    assignee: "",
    project: "",
  });
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: any;
  }>({ visible: false, x: 0, y: 0, content: null });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<ProjectWithPhases[]>({
    queryKey: ["/api/projects"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Extract unique assignees and statuses from all phases
  const { uniqueAssignees, uniqueStatuses } = useMemo(() => {
    const assignees = new Set<string>();
    const statuses = new Set<string>();
    
    projects.forEach(project => {
      project.phases?.forEach(phase => {
        if (phase.assignee) {
          assignees.add(phase.assignee.id);
        }
        statuses.add(phase.status);
      });
    });

    return {
      uniqueAssignees: Array.from(assignees),
      uniqueStatuses: Array.from(statuses),
    };
  }, [projects]);

  // Filter projects and phases based on search and filters
  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        // Project name/client search
        const matchesSearch = searchQuery === "" || 
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (project.client && project.client.toLowerCase().includes(searchQuery.toLowerCase()));

        // Project filter
        const matchesProject = filters.project === "" || project.id === filters.project;

        return matchesSearch && matchesProject;
      })
      .map(project => ({
        ...project,
        phases: project.phases?.filter(phase => {
          // Status filter
          const matchesStatus = filters.status === "" || phase.status === filters.status;
          
          // Assignee filter
          const matchesAssignee = filters.assignee === "" || phase.assigneeId === filters.assignee;

          return matchesStatus && matchesAssignee;
        }) || []
      }))
      .filter(project => project.phases.length > 0); // Only show projects with visible phases
  }, [projects, searchQuery, filters]);

  const handlePhaseHover = (phase: any, event: MouseEvent) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY - 10,
      content: phase,
    });
  };

  const handlePhaseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const clearFilter = (filterKey: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [filterKey]: "" }));
  };

  const clearAllFilters = () => {
    setFilters({ status: "", assignee: "", project: "" });
    setSearchQuery("");
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'in_progress': return <Clock className="h-3 w-3" />;
      case 'delayed': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (projectsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Project Timeline</h1>
            <p className="text-muted-foreground mt-1">Interactive timeline view of all projects and phases</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" data-testid="projects-count">
              {filteredProjects.length} Projects
            </Badge>
            <Badge variant="outline" data-testid="phases-count">
              {filteredProjects.reduce((acc, p) => acc + p.phases.length, 0)} Phases
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-timeline"
              />
            </div>
            
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters} data-testid="clear-all-filters">
                Clear All ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-4 flex-wrap gap-2">
            {/* Project Filter */}
            <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
              <SelectTrigger className="w-48" data-testid="filter-project">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-48" data-testid="filter-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Assignee Filter */}
            <Select value={filters.assignee} onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}>
              <SelectTrigger className="w-48" data-testid="filter-assignee">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Assignees</SelectItem>
                {uniqueAssignees.map(assigneeId => {
                  const user = users.find((u: any) => u.id === assigneeId);
                  return user ? (
                    <SelectItem key={assigneeId} value={assigneeId}>
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3" />
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Search: "{searchQuery}"</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.project && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Project: {projects.find(p => p.id === filters.project)?.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => clearFilter('project')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.status && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Status: {filters.status.replace('_', ' ')}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => clearFilter('status')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {filters.assignee && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>
                    Assignee: {users.find((u: any) => u.id === filters.assignee)?.name || 'Unknown'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => clearFilter('assignee')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Timeline Content */}
      <div className="flex-1 overflow-hidden p-8">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Timeline Data</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchQuery || activeFiltersCount > 0 
                  ? "No projects or phases match your current filters. Try adjusting your search or filters."
                  : "No projects with phases found. Create a project and add phases to see them on the timeline."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <Timeline
            projects={filteredProjects}
            onPhaseHover={handlePhaseHover}
            onPhaseLeave={handlePhaseLeave}
          />
        )}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div 
          className="fixed bg-card border border-border rounded-lg p-3 shadow-lg z-50 max-w-xs"
          style={{ left: tooltip.x, top: tooltip.y }}
          data-testid="phase-tooltip"
        >
          <div className="space-y-2">
            <div className="font-semibold text-foreground">{tooltip.content.name}</div>
            <div className="space-y-1 text-sm">
              {tooltip.content.assignee && (
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3" />
                  <span>{tooltip.content.assignee.name}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(tooltip.content.startDate), "MMM dd")} → {" "}
                  {format(new Date(tooltip.content.endDate), "MMM dd")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(tooltip.content.status)}
                <span className="capitalize">{tooltip.content.status.replace('_', ' ')}</span>
              </div>
            </div>
            {tooltip.content.notes && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                {tooltip.content.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
