import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/hooks/use-profile";

/** Read-only: company details are verified by an administrator. */
export function VendorDetailsCard({ vendor }: { vendor: NonNullable<UserProfile["vendorProfile"]> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business details</CardTitle>
        <CardDescription>These details are verified by an administrator and can't be edited.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" value={vendor.companyName} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brn">Business registration number</Label>
          <Input id="brn" value={vendor.businessRegistrationNumber} readOnly disabled />
        </div>
      </CardContent>
    </Card>
  );
}
