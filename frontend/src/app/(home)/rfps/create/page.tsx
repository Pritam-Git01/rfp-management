"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, CheckCircle, Edit2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { format } from "date-fns";
import { toast } from "sonner";
import type { RFP, RFPStructuredData, RFPItem } from "@/types";
import { AxiosError } from "axios";

interface CreateRFPResponse {
  rfp: RFP;
}

interface ApiError {
  error?: string;
}

export default function CreateRFPPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [structuredData, setStructuredData] = useState<RFPStructuredData | null>(null);
  const [title, setTitle] = useState("");
  const [rfpId, setRfpId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post<CreateRFPResponse>("/rfps", { description });
      setRfpId(response.data.rfp._id);
      setTitle(response.data.rfp.title);
      setStructuredData(response.data.rfp.structuredData || null);
      toast.success("RFP created successfully");
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      toast.error(axiosError.response?.data?.error || "Failed to create RFP");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      await axiosInstance.patch(`/rfps/${rfpId}`, {
        title,
        structuredData
      });
      router.push(`/rfps/${rfpId}`);
    } catch (error) {
      toast.error("Failed to save RFP");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof RFPStructuredData, value: string | number) => {
    if (!structuredData) return;
    setStructuredData({
      ...structuredData,
      [field]: value,
    });
  };

  const handleItemChange = (index: number, field: keyof RFPItem, value: string | number) => {
    if (!structuredData?.items) return;
    const newItems = [...structuredData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setStructuredData({ ...structuredData, items: newItems });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create RFP</h1>
        <p className="text-muted-foreground">
          Describe what you need in natural language
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Describe Your Requirements</CardTitle>
          <CardDescription>
            Tell us what you need to procure. Include items, quantities, budget,
            timeline, and any special requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Example: I need to procure 20 laptops with 16GB RAM and 15 monitors 27-inch. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with Intel i7 processor and 512GB SSD. Payment terms should be net 30, and we need at least 1 year warranty."
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              rows={8}
              disabled={loading || !!structuredData}
            />
          </div>

          {!structuredData && (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating RFP...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Generate RFP
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {structuredData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <CardTitle>Generated RFP</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                {editMode ? "View Mode" : "Edit Mode"}
              </Button>
            </div>
            <CardDescription>
              Review and edit the structured data extracted from your
              description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {editMode ? (
              <>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Items</Label>
                  {structuredData.items?.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid gap-3">
                        <Input
                          placeholder="Item name"
                          value={item.name || ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleItemChange(index, "name", e.target.value)
                          }
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            placeholder="Quantity"
                            value={item.quantity || ""}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                          <Input
                            placeholder="Specifications"
                            value={item.specifications || ""}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              handleItemChange(
                                index,
                                "specifications",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Budget ($)</Label>
                    <Input
                      type="number"
                      value={structuredData.budget || ""}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleFieldChange("budget", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Deadline</Label>
                    <Input
                      type="date"
                      value={
                        structuredData.deliveryDeadline
                          ? format(
                              new Date(structuredData.deliveryDeadline),
                              "yyyy-MM-dd"
                            )
                          : ""
                      }
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleFieldChange("deliveryDeadline", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Input
                    value={structuredData.paymentTerms || ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleFieldChange("paymentTerms", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Warranty Requirements</Label>
                  <Input
                    value={structuredData.warrantyRequirements || ""}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      handleFieldChange("warrantyRequirements", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Terms</Label>
                  <Textarea
                    value={structuredData.additionalTerms || ""}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      handleFieldChange("additionalTerms", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <p className="text-lg font-medium">{title}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Items</Label>
                  <div className="mt-2 space-y-2">
                    {structuredData.items?.map((item, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.specifications}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Budget</Label>
                    <p className="text-lg font-medium">
                      ${structuredData.budget?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Delivery Deadline
                    </Label>
                    <p className="text-lg font-medium">
                      {structuredData.deliveryDeadline
                        ? format(
                            new Date(structuredData.deliveryDeadline),
                            "MMM dd, yyyy"
                          )
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Payment Terms</Label>
                  <p className="font-medium">{structuredData.paymentTerms}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    Warranty Requirements
                  </Label>
                  <p className="font-medium">
                    {structuredData.warrantyRequirements}
                  </p>
                </div>

                {structuredData.additionalTerms && (
                  <div>
                    <Label className="text-muted-foreground">
                      Additional Terms
                    </Label>
                    <p className="font-medium">
                      {structuredData.additionalTerms}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setStructuredData(null);
                  setTitle("");
                  setRfpId(null);
                  setEditMode(false);
                }}
                className="flex-1"
              >
                Start Over
              </Button>
              <Button
                disabled={isSaving}
                onClick={handleSaveAndContinue}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Continue"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
