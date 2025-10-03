import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Timeline } from "@/components/timeline";
import { ProjectModal } from "@/components/project-modal";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ui/theme-provider";
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Sun, 
  Moon,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Check,
  Edit,
  Users,
  Activity
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: any;
  }>({ visible: false, x: 0, y: 0, content: null });
  
  const { theme, setTheme } = useTheme();

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: timelineData = [], isLoading: timelineLoading } = useQuery({
    queryKey: ["/api/timeline"],
  });

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const filteredProjects = projects.filter((project: any) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.client && project.client.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (projectsLoading || statsLoading || timelineLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="bg-card border-b border-border px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Search & Filters */}
          <div className="flex items-center space-x-4 flex-1 max-w-2xl">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-projects"
              />
            </div>

            {/* Filter Dropdown */}
            <Button variant="outline" data-testid="filter-button">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Export */}
            <Button variant="outline" data-testid="export-button">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Add Project */}
            <Button 
              onClick={() => setShowProjectModal(true)}
              data-testid="add-project-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto bg-background p-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Projects"
            value={stats?.totalProjects || 0}
            change={stats?.projectsChange || "+0%"}
            changeType="positive"
            icon={FolderOpen}
            iconColor="primary"
          />
          <StatsCard
            title="Completed Phases"
            value={stats?.completedPhases || 0}
            change={stats?.completedChange || "+0%"}
            changeType="positive"
            icon={CheckCircle}
            iconColor="success"
          />
          <StatsCard
            title="In Progress"
            value={stats?.inProgressPhases || 0}
            change={stats?.inProgressChange || "+0%"}
            changeType="neutral"
            icon={Clock}
            iconColor="warning"
          />
          <StatsCard
            title="Delayed Phases"
            value={stats?.delayedPhases || 0}
            change={stats?.delayedChange || "+0"}
            changeType="negative"
            icon={AlertTriangle}
            iconColor="destructive"
          />
        </div>

        {/* Timeline Section */}
        <Timeline
          projects={filteredProjects}
          onPhaseHover={handlePhaseHover}
          onPhaseLeave={handlePhaseLeave}
        />

        {/* Recent Activity & Team Members */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3" data-testid={`activity-${index}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityIconBg(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                        <span className="font-medium"> {activity.target}</span>
                        {activity.project && ` in ${activity.project}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.timestamp), "PPpp")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Team Members</span>
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.teamMembers?.length > 0 ? (
                stats.teamMembers.map((member: any, index: number) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors" data-testid={`team-member-${index}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(member.status)}`}>
                        {member.activePhases} Active
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No team members</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
                <Clock className="h-3 w-3" />
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

      <ProjectModal 
        open={showProjectModal}
        onClose={() => setShowProjectModal(false)}
      />
    </main>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'completed': return <Check className="h-3 w-3 text-success" />;
    case 'updated': return <Edit className="h-3 w-3 text-warning" />;
    case 'delayed': return <AlertTriangle className="h-3 w-3 text-destructive" />;
    case 'created': return <Plus className="h-3 w-3 text-primary" />;
    default: return <Activity className="h-3 w-3 text-muted-foreground" />;
  }
}

function getActivityIconBg(type: string) {
  switch (type) {
    case 'completed': return 'bg-success/10';
    case 'updated': return 'bg-warning/10';
    case 'delayed': return 'bg-destructive/10';
    case 'created': return 'bg-primary/10';
    default: return 'bg-muted';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-3 w-3 text-success" />;
    case 'in_progress': return <Clock className="h-3 w-3 text-warning" />;
    case 'delayed': return <AlertTriangle className="h-3 w-3 text-destructive" />;
    default: return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'high': return 'bg-success/10 text-success';
    case 'medium': return 'bg-warning/10 text-warning';
    case 'low': return 'bg-destructive/10 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
}
