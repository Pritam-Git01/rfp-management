"use client";

import { useEffect, useState, ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Mail, Phone, User, Star, Edit, Loader2 } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import type { Vendor, VendorWithCategoryString } from "@/types";

interface VendorsResponse {
  vendors: Vendor[];
}

interface UpdateVendorResponse {
  vendor: Vendor;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVendor, setEditingVendor] = useState<VendorWithCategoryString | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = vendors.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.category?.some((cat) =>
            cat.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredVendors(filtered);
    } else {
      setFilteredVendors(vendors);
    }
  }, [searchQuery, vendors]);

  const fetchVendors = async () => {
    try {
      const response = await axiosInstance.get<VendorsResponse>("/vendors");
      setVendors(response.data.vendors || []);
      console.log(response.data.vendors);
      setFilteredVendors(response.data.vendors || []);
    } catch (error) {
      toast.error("Failed to fetch vendors");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (vendor: Vendor) => {
    setEditingVendor({
      ...vendor,
      categoryString: vendor.category?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!editingVendor) return;

    setIsSaving(true);
    try {
      const updatedData: Partial<Vendor> = {
        ...editingVendor,
        category: editingVendor.categoryString
          ?.split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      };
      delete (updatedData as VendorWithCategoryString).categoryString;

      const response = await axiosInstance.put<UpdateVendorResponse>(
        `/vendors/${editingVendor._id}`,
        updatedData
      );

      setVendors((prev) =>
        prev.map((v) =>
          v._id === editingVendor._id ? response.data.vendor : v
        )
      );
      toast.success("Vendor updated successfully");
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update vendor");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof VendorWithCategoryString, value: string) => {
    if (!editingVendor) return;
    setEditingVendor({ ...editingVendor, [field]: value });
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <p className="text-muted-foreground">
          Browse available vendors for your RFPs
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors by name, email, or category..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVendors.map((vendor) => (
          <Card key={vendor._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{vendor.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {vendor.rating.toFixed(1)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditClick(vendor)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {vendor.contactPerson}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${vendor.email}`}
                  className="text-primary hover:underline truncate"
                >
                  {vendor.email}
                </a>
              </div>

              {vendor.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${vendor.phone}`} className="hover:underline">
                    {vendor.phone}
                  </a>
                </div>
              )}

              {vendor.category && vendor.category.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {vendor.category.map((cat, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredVendors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
            <p className="text-sm text-muted-foreground">
              Try a different search term
            </p>
          </CardContent>
        </Card>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>
              Make changes to the vendor&apos;s profile here. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          {editingVendor && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-left">
                  Name
                </Label>
                <Input
                  id="name"
                  value={editingVendor.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange('name', e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-left">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingVendor.email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange('email', e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-left">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={editingVendor.phone || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange('phone', e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-left">
                  Contact
                </Label>
                <Input
                  id="contact"
                  value={editingVendor.contactPerson || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange('contactPerson', e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-left">
                  Category
                </Label>
                <Input
                  id="category"
                  placeholder="IT, Hardware, etc."
                  value={editingVendor.categoryString || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange('categoryString', e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSaveVendor}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
