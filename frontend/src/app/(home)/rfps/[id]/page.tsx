"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Send,
  FileText,
  Clock,
  DollarSign,
  Calendar,
  Shield,
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";
import type { RFP, Vendor, Proposal } from "@/types";
import { AxiosError } from "axios";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

interface RFPResponse {
  rfp: RFP;
}

interface VendorsResponse {
  vendors: Vendor[];
}

interface ProposalsResponse {
  proposals: Proposal[];
}

interface ApiError {
  error?: string;
}

export default function RFPDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [rfp, setRfp] = useState<RFP | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const rfpId = params.id as string;

  useEffect(() => {
    if (rfpId) {
      fetchRFPDetails();
      fetchVendors();
      fetchProposals();
    }
  }, [rfpId]);

  const fetchRFPDetails = async () => {
    try {
      const response = await axiosInstance.get<RFPResponse>(`/rfps/${rfpId}`);
      setRfp(response.data.rfp);
      const vendorIds = response.data.rfp.vendors?.map((v) => {
        if (typeof v === 'string') return v;
        return v._id;
      }) || [];
      setSelectedVendors(vendorIds);
    } catch (error) {
      toast.error("Failed to fetch RFP details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axiosInstance.get<VendorsResponse>("/vendors");
      setVendors(response.data.vendors || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await axiosInstance.get<ProposalsResponse>(`/proposals/rfp/${rfpId}`);
      setProposals(response.data.proposals || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    }
  };

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSendRFP = async () => {
    if (selectedVendors.length === 0) {
      toast.error("Please select at least one vendor");
      return;
    }

    setSending(true);
    try {
      await axiosInstance.post(`/rfps/${rfpId}/send`, {
        vendorIds: selectedVendors,
      });

      toast.success(`RFP sent to ${selectedVendors.length} vendor(s)`);

      fetchRFPDetails();
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to send RFP");
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: RFP['status']): BadgeVariant => {
    const colors: Record<RFP['status'], BadgeVariant> = {
      draft: "secondary",
      sent: "default",
      receiving: "outline",
      completed: "success",
    };
    return colors[status] || "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">RFP not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{rfp.title}</h1>
          <p className="text-muted-foreground">
            Created {format(new Date(rfp.createdAt), "MMM dd, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getStatusColor(rfp.status)}>{rfp.status}</Badge>
          {proposals.length > 0 && (
            <Button onClick={() => router.push(`/rfps/${rfpId}/compare`)}>
              Compare Proposals ({proposals.length})
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
          <TabsTrigger value="proposals">
            Proposals ({proposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-2">
                  {rfp.structuredData?.items?.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.specifications}
                          </p>
                        </div>
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-semibold">
                        ${rfp.structuredData?.budget?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery</p>
                      <p className="font-semibold text-sm">
                        {rfp.structuredData?.deliveryDeadline
                          ? format(
                              new Date(rfp.structuredData.deliveryDeadline),
                              "MMM dd"
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Payment</p>
                      <p className="font-semibold text-sm">
                        {rfp.structuredData?.paymentTerms}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Warranty</p>
                      <p className="font-semibold text-sm">
                        {rfp.structuredData?.warrantyRequirements}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {rfp.structuredData?.additionalTerms && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Terms</h3>
                  <p className="text-sm text-muted-foreground">
                    {rfp.structuredData.additionalTerms}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Original Description</h3>
                <p className="text-sm text-muted-foreground">
                  {rfp.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Vendors</CardTitle>
              <CardDescription>
                Choose vendors to send this RFP to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {vendors.map((vendor) => (
                <div
                  key={vendor._id}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={vendor._id}
                    checked={selectedVendors.includes(vendor._id)}
                    onCheckedChange={() => handleVendorToggle(vendor._id)}
                  />
                  <label htmlFor={vendor._id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {vendor.email} • {vendor.contactPerson}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {vendor.category?.slice(0, 2).map((cat, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {cat}
                          </Badge>
                        ))}
                        <Badge variant="outline">
                          ★ {vendor.rating.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  </label>
                </div>
              ))}

              <Button
                onClick={handleSendRFP}
                disabled={sending || selectedVendors.length === 0}
                className="w-full mt-4"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send RFP to {selectedVendors.length} Vendor(s)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-4">
          {proposals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {rfp.status === "draft"
                    ? "Send this RFP to vendors to receive proposals"
                    : "Waiting for vendor responses..."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <Card key={proposal._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {proposal.vendorId?.name || "Unknown Vendor"}
                      </CardTitle>
                      <Badge
                        variant={
                          proposal.status === "analyzed" ? "success" : "default"
                        }
                      >
                        {proposal.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Received{" "}
                      {format(
                        new Date(proposal.receivedAt || proposal.createdAt),
                        "MMM dd, yyyy"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {proposal.parsedData && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Total Cost
                            </p>
                            <p className="text-lg font-semibold">
                              ${proposal.parsedData.totalCost?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Delivery
                            </p>
                            <p className="text-sm font-medium">
                              {proposal.parsedData.deliveryTimeline}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Payment
                            </p>
                            <p className="text-sm font-medium">
                              {proposal.parsedData.paymentTerms}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Warranty
                            </p>
                            <p className="text-sm font-medium">
                              {proposal.parsedData.warrantyOffered}
                            </p>
                          </div>
                        </div>

                        {proposal.aiAnalysis && (
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-2">
                              AI Analysis:
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Completeness:
                                </span>
                                <span className="ml-2 font-medium">
                                  {proposal.aiAnalysis.completenessScore}%
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Price:
                                </span>
                                <span className="ml-2 font-medium">
                                  {proposal.aiAnalysis.priceCompetitiveness}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
