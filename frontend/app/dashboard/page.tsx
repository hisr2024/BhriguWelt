"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEncryption } from "@/lib/context/EncryptionContext";

export default function DashboardPage() {
  const router = useRouter();
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();

  useEffect(() => {
    if (encryptionLoading) return;

    if (!isSetup) {
      router.replace("/setup");
      return;
    }

    if (!isUnlocked) {
      router.replace("/unlock");
      return;
    }
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  if (encryptionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Welcome to BhriguWelt</h2>
          <p className="text-muted-foreground">
            Your encryption is set up and unlocked. You can now securely manage your data.
          </p>
        </div>
      </div>
    </div>
  );
}
