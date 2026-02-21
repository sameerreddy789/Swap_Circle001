'use client';

import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function ActiveFilters({ filters }) {
    if (filters.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
            {filters.map(filter => (
                <Badge key={filter.key} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                    {filter.value}
                    <button onClick={filter.clear} className="ml-2 rounded-full hover:bg-black/20 p-0.5">
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {filter.key} filter</span>
                    </button>
                </Badge>
            ))}
        </div>
    );
}
