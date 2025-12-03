"use client";

import { useEffect, useState, ChangeEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Trash2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { format } from "date-fns";
import { toast } from "sonner";
import type { RFP } from "@/types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

interface RFPsResponse {
  rfps: RFP[];
}

export default function RFPsPage() {
  const router = useRouter();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [filteredRFPs, setFilteredRFPs] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRFPs();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = rfps.filter(
        (rfp) =>
          rfp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rfp.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRFPs(filtered);
    } else {
      setFilteredRFPs(rfps);
    }
  }, [searchQuery, rfps]);

  const fetchRFPs = async () => {
    try {
      const response = await axiosInstance.get<RFPsResponse>("/rfps");
      setRfps(response.data.rfps || []);
      setFilteredRFPs(response.data.rfps || []);
    } catch (error) {
      toast.error("Failed to fetch RFPs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this RFP?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/rfps/${id}`);
      toast.success("RFP deleted successfully");
      fetchRFPs();
    } catch (error) {
      toast.error("Failed to delete RFP");
      console.error(error);
    }
  };

  const getStatusVariant = (status: RFP['status']): BadgeVariant => {
    const variants: Record<RFP['status'], BadgeVariant> = {
      draft: "secondary",
      sent: "default",
      receiving: "outline",
      completed: "default",
    };
    return variants[status] || "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RFPs</h1>
          <p className="text-muted-foreground">
            Manage your requests for proposals
          </p>
        </div>
        <Button onClick={() => router.push("/rfps/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create RFP
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search RFPs..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredRFPs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No RFPs found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Get started by creating your first RFP"}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push("/rfps/create")}>
                <Plus className="mr-2 h-4 w-4" />
                Create RFP
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRFPs.map((rfp) => (
            <Card
              key={rfp._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/rfps/${rfp._id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-1">
                    {rfp.title}
                  </CardTitle>
                  <Badge variant={getStatusVariant(rfp.status)}>
                    {rfp.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {rfp.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {rfp.structuredData?.budget && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">
                        ${rfp.structuredData.budget.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-medium">
                      {rfp.structuredData?.items?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendors:</span>
                    <span className="font-medium">
                      {rfp.vendors?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      Created {format(new Date(rfp.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(rfp._id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
