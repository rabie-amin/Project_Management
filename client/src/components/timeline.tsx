import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachMonthOfInterval, 
  addMonths,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  addWeeks,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  addDays
} from "date-fns";
import { type ProjectWithPhases } from "@shared/schema";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TimelineProps {
  projects: ProjectWithPhases[];
  onPhaseHover?: (phase: any, event: MouseEvent) => void;
  onPhaseLeave?: () => void;
  onPhaseClick?: (phase: any) => void;
}

const statusColors = {
  completed: '#22c55e', // green
  in_progress: '#eab308', // yellow
  delayed: '#ef4444', // red
  pending: '#94a3b8', // gray
};

export function Timeline({ projects, onPhaseHover, onPhaseLeave, onPhaseClick }: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    if (!svgRef.current || !projects.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 60, right: 20, bottom: 40, left: 200 };
    const width = 1200 * zoomLevel;
    const height = projects.length * 80 + margin.top + margin.bottom;

    svg.attr("width", width).attr("height", height);

    // Create main group
    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate date range
    const allDates = projects.flatMap(p => 
      p.phases.map(ph => [new Date(ph.startDate), new Date(ph.endDate)]).flat()
    );
    const minDate = d3.min(allDates) || new Date();
    const maxDate = d3.max(allDates) || new Date();
    
    // Add padding to date range based on view mode
    let startDate: Date, endDate: Date, timeIntervals: Date[], formatString: string;
    
    if (viewMode === 'day') {
      startDate = startOfDay(addDays(minDate, -7));
      endDate = endOfDay(addDays(maxDate, 7));
      timeIntervals = eachDayOfInterval({ start: startDate, end: endDate });
      formatString = "MMM dd";
    } else if (viewMode === 'week') {
      startDate = startOfWeek(addWeeks(minDate, -2));
      endDate = endOfWeek(addWeeks(maxDate, 2));
      timeIntervals = eachWeekOfInterval({ start: startDate, end: endDate });
      formatString = "MMM dd";
    } else {
      startDate = startOfMonth(addMonths(minDate, -1));
      endDate = endOfMonth(addMonths(maxDate, 1));
      timeIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
      formatString = "MMM";
    }

    // Create scales
    const xScale = d3.scaleTime()
      .domain([startDate, endDate])
      .range([0, width - margin.left - margin.right]);

    const yScale = d3.scaleBand()
      .domain(projects.map(p => p.id))
      .range([0, projects.length * 80])
      .padding(0.2);

    // Create time axis labels
    g.selectAll(".time-label")
      .data(timeIntervals)
      .enter()
      .append("text")
      .attr("class", "time-label")
      .attr("x", d => xScale(d))
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "hsl(var(--muted-foreground))")
      .text(d => format(d, formatString));

    // Grid lines
    g.selectAll(".grid-line")
      .data(timeIntervals)
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", projects.length * 80)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.3);

    // Project rows
    projects.forEach((project, index) => {
      const projectGroup = g.append("g")
        .attr("transform", `translate(0, ${index * 80})`);

      // Project label
      projectGroup.append("text")
        .attr("x", -10)
        .attr("y", 25)
        .attr("text-anchor", "end")
        .attr("font-size", "14px")
        .attr("font-weight", "600")
        .attr("fill", "hsl(var(--foreground))")
        .text(project.name);

      projectGroup.append("text")
        .attr("x", -10)
        .attr("y", 40)
        .attr("text-anchor", "end")
        .attr("font-size", "11px")
        .attr("fill", "hsl(var(--muted-foreground))")
        .text(project.client || "");

      // Phase blocks
      project.phases.forEach(phase => {
        const startX = xScale(new Date(phase.startDate));
        const endX = xScale(new Date(phase.endDate));
        const blockWidth = Math.max(endX - startX, 20);

        const phaseGroup = projectGroup.append("g")
          .attr("class", "phase-block")
          .attr("cursor", "pointer");

        // Phase rectangle
        phaseGroup.append("rect")
          .attr("x", startX)
          .attr("y", 10)
          .attr("width", blockWidth)
          .attr("height", 35)
          .attr("rx", 6)
          .attr("fill", statusColors[phase.status] || statusColors.pending)
          .attr("opacity", phase.status === 'pending' ? 0.6 : 1);

        // Phase text
        if (blockWidth > 60) {
          phaseGroup.append("text")
            .attr("x", startX + blockWidth / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "500")
            .attr("fill", "white")
            .text(phase.name);
        }

        // Status icon
        phaseGroup.append("text")
          .attr("x", startX + blockWidth - 8)
          .attr("y", 30)
          .attr("text-anchor", "middle")
          .attr("font-family", "Font Awesome 6 Free")
          .attr("font-weight", "900")
          .attr("font-size", "10px")
          .attr("fill", "white")
          .text(getStatusIcon(phase.status));

        // Event handlers
        phaseGroup
          .on("mouseenter", function(event) {
            d3.select(this).select("rect")
              .transition()
              .duration(200)
              .attr("transform", "translate(0, -2)")
              .attr("filter", "drop-shadow(0 4px 12px rgba(0,0,0,0.15))");
            
            onPhaseHover?.(phase, event as MouseEvent);
          })
          .on("mouseleave", function() {
            d3.select(this).select("rect")
              .transition()
              .duration(200)
              .attr("transform", "translate(0, 0)")
              .attr("filter", "none");
            
            onPhaseLeave?.();
          })
          .on("click", () => onPhaseClick?.(phase));
      });
    });

  }, [projects, zoomLevel, viewMode]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  const handleFitView = () => setZoomLevel(1);

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '⟳';
      case 'delayed': return '⚠';
      default: return '○';
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Timeline Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Multi-Project Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">Overview of all active projects and their phases</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Timeline Controls */}
          <div className="flex items-center space-x-2 bg-background rounded-lg p-1 border border-input">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              data-testid="timeline-zoom-out"
            >
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              data-testid="timeline-zoom-in"
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitView}
              data-testid="timeline-fit-view"
            >
              <Maximize className="h-4 w-4 mr-1" />
              Fit
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-background rounded-lg p-1 border border-input">
            {(['month', 'week', 'day'] as const).map(mode => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                data-testid={`timeline-view-${mode}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div ref={containerRef} className="timeline-container overflow-auto" style={{ height: "600px", width: "100%" }}>
        <svg ref={svgRef} className="timeline-canvas" />
      </div>

      {/* Timeline Legend */}
      <div className="px-6 py-4 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-success rounded"></div>
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-warning rounded"></div>
              <span className="text-xs text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-destructive rounded"></div>
              <span className="text-xs text-muted-foreground">Delayed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-muted border border-border rounded"></div>
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">2024 Timeline View</p>
        </div>
      </div>
    </Card>
  );
}
