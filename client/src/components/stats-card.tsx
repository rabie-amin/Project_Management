import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: "primary" | "success" | "warning" | "destructive";
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  iconColor = "primary" 
}: StatsCardProps) {
  const getIconBgClass = () => {
    switch (iconColor) {
      case "success": return "bg-success/10 text-success";
      case "warning": return "bg-warning/10 text-warning";
      case "destructive": return "bg-destructive/10 text-destructive";
      default: return "bg-primary/10 text-primary";
    }
  };

  const getChangeClass = () => {
    switch (changeType) {
      case "positive": return "text-success";
      case "negative": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`stats-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconBgClass()}`}>
            <Icon className="h-6 w-6" />
          </div>
          {change && (
            <span className={`text-xs font-medium ${getChangeClass()}`}>
              {change}
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-1" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </h3>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}
