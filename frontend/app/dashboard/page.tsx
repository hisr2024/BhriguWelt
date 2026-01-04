"use client";

import { useEffect, useState } from "react";
import { useEncryption } from "@/lib/context/EncryptionContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalPatients: number;
  totalRecords: number;
  upcomingAppointments: number;
  recentActivity: number;
}

interface RecentPatient {
  id: string;
  name: string;
  lastVisit: string;
  status: "stable" | "attention" | "critical";
}

export default function DashboardPage() {
  const { encryptionKey, isUnlocked } = useEncryption();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalPatients: 156,
        totalRecords: 1247,
        upcomingAppointments: 12,
        recentActivity: 34
      });

      setRecentPatients([
        { id: "1", name: "John Doe", lastVisit: "2024-01-15", status: "stable" },
        { id: "2", name: "Jane Smith", lastVisit: "2024-01-14", status: "attention" },
        { id: "3", name: "Robert Johnson", lastVisit: "2024-01-13", status: "stable" },
        { id: "4", name: "Emily Davis", lastVisit: "2024-01-12", status: "critical" },
      ]);

      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const getStatusIcon = (status: RecentPatient["status"]) => {
    switch (status) {
      case "stable":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "attention":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: RecentPatient["status"]) => {
    switch (status) {
      case "stable":
        return "Stable";
      case "attention":
        return "Needs Attention";
      case "critical":
        return "Critical";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your practice.
        </p>
      </div>

      {/* Encryption Status Banner */}
      {!isUnlocked && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 dark:text-yellow-200">
                Encryption key not set. Some features may be limited.
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
              Set Encryption Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalPatients}</div>
                <p className="text-xs text-muted-foreground">+12 from last month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalRecords}</div>
                <p className="text-xs text-muted-foreground">+89 from last month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.upcomingAppointments}</div>
                <p className="text-xs text-muted-foreground">Scheduled this week</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.recentActivity}</div>
                <p className="text-xs text-muted-foreground">Actions today</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Patients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Patients</CardTitle>
          <Link href="/patients">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last visit: {patient.lastVisit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(patient.status)}
                    <span className="text-sm">{getStatusText(patient.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Link href="/patients/new">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Add New Patient
            </Button>
          </Link>
          <Link href="/records/new">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Create Record
            </Button>
          </Link>
          <Link href="/appointments/new">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
