"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, Clock, CheckCircle, Plus } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { format } from "date-fns";
import type { RFP, DashboardStats } from "@/types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

interface RFPsResponse {
  rfps: RFP[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    draft: 0,
    sent: 0,
    receiving: 0,
    completed: 0,
  });
  const [recentRFPs, setRecentRFPs] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get<RFPsResponse>("/rfps");
      const rfps = response.data.rfps || [];

      const statsData: DashboardStats = {
        total: rfps.length,
        draft: rfps.filter((r) => r.status === "draft").length,
        sent: rfps.filter((r) => r.status === "sent").length,
        receiving: rfps.filter((r) => r.status === "receiving").length,
        completed: rfps.filter((r) => r.status === "completed").length,
      };

      setStats(statsData);
      setRecentRFPs(rfps.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: RFP['status']) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4" />;
      case "sent":
        return <Send className="h-4 w-4" />;
      case "receiving":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: RFP['status']): BadgeVariant => {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
        return "default";
      case "receiving":
        return "outline";
      case "completed":
        return "default";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your RFP management
          </p>
        </div>
        <Button onClick={() => router.push("/rfps/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create RFP
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFPs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receiving</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.receiving}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent RFPs</CardTitle>
          <CardDescription>Your latest requests for proposals</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRFPs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No RFPs yet. Create your first one!</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/rfps/create")}
              >
                Create RFP
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRFPs.map((rfp) => (
                <div
                  key={rfp._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/rfps/${rfp._id}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(rfp.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{rfp.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Created{" "}
                        {format(new Date(rfp.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(rfp.status)}>
                    {rfp.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
