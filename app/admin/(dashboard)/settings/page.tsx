import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Profil Admin
          </CardTitle>
          <CardDescription>
            Pengaturan akun admin. Belum tersambung ke sistem autentikasi — form ini masih tampilan awal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="admin-name">Nama</Label>
            <Input id="admin-name" defaultValue="Admin" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" defaultValue="admin@mayangcollection.com" />
          </div>
          <Button disabled>Simpan Perubahan</Button>
        </CardContent>
      </Card>
    </div>
  );
}
