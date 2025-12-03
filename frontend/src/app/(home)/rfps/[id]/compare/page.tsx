"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import type { ComparisonData, ComparisonProposal } from "@/types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

export default function CompareProposalsPage() {
  const params = useParams();
  const router = useRouter();
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  const rfpId = params.id as string;

  useEffect(() => {
    if (rfpId) {
      fetchComparison();
    }
  }, [rfpId]);

  const fetchComparison = async () => {
    try {
      const response = await axiosInstance.get<ComparisonData>(
        `/proposals/rfp/${rfpId}/compare`
      );
      setComparison(response.data);
    } catch (error) {
      toast.error("Failed to fetch comparison data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceBadgeVariant = (termsCompliance?: string): BadgeVariant => {
    if (termsCompliance?.includes("Fully")) return "success";
    if (termsCompliance?.includes("Partial")) return "outline";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!comparison?.hasProposals) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No proposals to compare
            </h3>
            <p className="text-sm text-muted-foreground">
              Wait for vendors to respond to your RFP
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bestVendor = comparison.proposals.find(
    (p) => p.vendorId === comparison.aiRecommendation?.bestVendorId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Proposal Comparison
          </h1>
          <p className="text-muted-foreground">
            AI-powered analysis of {comparison.proposals.length} proposals
          </p>
        </div>
      </div>

      {comparison.aiRecommendation && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>AI Recommendation</CardTitle>
            </div>
            <CardDescription>Based on comprehensive analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-primary">
                  {bestVendor?.vendorName || "Best Vendor"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Overall Score:{" "}
                  {
                    comparison.aiRecommendation.overallScore?.[
                      comparison.aiRecommendation.bestVendorId
                    ]
                  }
                </p>
              </div>
              <Badge className="text-lg px-4 py-2">Recommended</Badge>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Reasoning:</h4>
              <p className="text-sm text-muted-foreground">
                {comparison.aiRecommendation.reasoning}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Price Analysis:</h4>
              <p className="text-sm text-muted-foreground">
                {comparison.aiRecommendation.priceComparison}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Total Proposals
              </p>
              <p className="text-2xl font-bold">
                {comparison.summary.totalProposals}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Lowest Price</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${comparison.summary.lowestPrice?.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <p className="text-sm text-muted-foreground">Highest Price</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                ${comparison.summary.highestPrice?.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Avg. Completeness
              </p>
              <p className="text-2xl font-bold">
                {Math.round(comparison.summary.averageCompleteness)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Detailed Comparison</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-sm">
                <th className="text-left p-4 font-semibold">Vendor</th>
                <th className="text-left p-4 font-semibold">Total Cost</th>
                <th className="text-left p-4 font-semibold">Delivery</th>
                <th className="text-left p-4 font-semibold">Payment Terms</th>
                <th className="text-left p-4 font-semibold">Warranty</th>
                <th className="text-left p-4 font-semibold">Completeness</th>
                <th className="text-left p-4 font-semibold">Compliance</th>
                <th className="text-left p-4 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {comparison.proposals.map((proposal: ComparisonProposal) => {
                const isRecommended =
                  proposal.vendorId ===
                  comparison.aiRecommendation?.bestVendorId;
                const score =
                  comparison.aiRecommendation?.overallScore?.[
                    proposal.vendorId
                  ];

                return (
                  <tr
                    key={proposal.vendorId}
                    className={`border-b text-sm ${
                      isRecommended ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {proposal.vendorName}
                        </span>
                        {isRecommended && (
                          <Badge variant="default" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">
                      ${proposal.totalCost?.toLocaleString() || "N/A"}
                    </td>
                    <td className="p-4">
                      {proposal.deliveryTimeline || "N/A"}
                    </td>
                    <td className="p-4">{proposal.paymentTerms || "N/A"}</td>
                    <td className="p-4">{proposal.warrantyOffered || "N/A"}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          (proposal.completenessScore ?? 0) >= 80
                            ? "success"
                            : "secondary"
                        }
                      >
                        {proposal.completenessScore || 0}%
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={getComplianceBadgeVariant(proposal.termsCompliance)}
                        className="p-2 px-4"
                      >
                        {proposal.termsCompliance || "N/A"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-lg font-bold text-primary">
                        {score || "N/A"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Individual Proposals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comparison.proposals.map((proposal: ComparisonProposal) => {
            const isRecommended =
              proposal.vendorId === comparison.aiRecommendation?.bestVendorId;
            const score =
              comparison.aiRecommendation?.overallScore?.[proposal.vendorId];

            return (
              <Card
                key={proposal.vendorId}
                className={isRecommended ? "border-primary" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {proposal.vendorName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isRecommended && (
                        <Badge variant="default">
                          <Award className="mr-1 h-3 w-3" />
                          Recommended
                        </Badge>
                      )}
                      <Badge variant="outline">Score: {score}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Cost
                      </p>
                      <p className="text-lg font-semibold">
                        ${proposal.totalCost?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Delivery Timeline
                      </p>
                      <p className="text-base font-medium">{proposal.deliveryTimeline}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Completeness
                      </p>
                      <Badge
                        variant={
                          (proposal.completenessScore ?? 0) >= 80
                            ? "success"
                            : "secondary"
                        }
                      >
                        {proposal.completenessScore}%
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        Terms Compliance
                      </p>
                      <Badge
                        variant={getComplianceBadgeVariant(proposal.termsCompliance)}
                        className="p-2 px-4"
                      >
                        {proposal.termsCompliance}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
