import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Clock } from "lucide-react";
import { Site } from "@/types/scheduling";

interface SiteSelectorProps {
  sites: Site[];
  selectedSiteId?: string;
  onSiteChange: (siteId: string) => void;
  employeeCounts?: { [siteId: string]: number };
}

export const SiteSelector = ({ 
  sites, 
  selectedSiteId, 
  onSiteChange,
  employeeCounts = {}
}: SiteSelectorProps) => {
  const selectedSite = sites.find(site => site.id === selectedSiteId);

  return (
    <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-medium">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5" />
          <div>
            <Select value={selectedSiteId} onValueChange={onSiteChange}>
              <SelectTrigger className="w-[250px] bg-white/10 border-white/20 text-white hover:bg-white/15 focus:bg-white/15">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id} className="text-foreground">
                    <div className="flex items-center justify-between w-full">
                      <span>{site.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {site.code}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSite && (
              <p className="text-sm opacity-90 mt-1">
                {selectedSite.address}
              </p>
            )}
          </div>
        </div>
        
        {selectedSite && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{employeeCounts[selectedSite.id] || 0} employees</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Capacity: {selectedSite.capacity}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};