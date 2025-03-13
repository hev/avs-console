"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  HelpCircle,
  BookOpen,
  Zap,
  Shield,
  Users,
  Server,
  Settings,
  Search,
  LayoutDashboard,
  Rocket,
} from "lucide-react"
import { NodeListView } from "./components/node-list-view"
import { IndexListView } from "./components/index-list-view"
import { UserListView } from "./components/user-list-view"
import { RoleListView } from "./components/role-list-view"
import { ConfigView } from "./components/config-view"
import { QueryView } from "./components/query-view"
import { DashboardView } from "./components/dashboard-view"
import { ThemeToggle } from "./components/theme-toggle"
import { useTheme } from "next-themes"
import { fetchClusterInfo, type ClusterInfo, fetchUsers, fetchRoles } from "./lib/api"

export default function AerospikeVectorSearch() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { setTheme } = useTheme()
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [featuresAvailable, setFeaturesAvailable] = useState({
    users: true,
    roles: true
  })

  // Set dark mode on initial load
  useEffect(() => {
    setTheme("dark")
  }, [setTheme])

  // Fetch cluster info for the sidebar
  useEffect(() => {
    const loadClusterInfo = async () => {
      try {
        setLoading(true)
        const data = await fetchClusterInfo()
        setClusterInfo(data)
      } catch (err) {
        console.error("Failed to load cluster info:", err)
      } finally {
        setLoading(false)
      }
    }

    loadClusterInfo()
  }, [])

  // Add feature availability check
  useEffect(() => {
    const checkFeatures = async () => {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetchUsers(),
        fetchRoles()
      ]);
      
      setFeaturesAvailable({
        users: usersResponse.available,
        roles: rolesResponse.available
      });
    };
    
    checkFeatures();
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-[800px] bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">AVS Console</h1>
            <Badge variant="outline" className="ml-2">
              v0.1.0
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="https://aerospike.com/docs/vector" target="_blank" rel="noopener noreferrer">
                <HelpCircle className="h-4 w-4 mr-2" />
                Documentation
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com/aerospike/aerospike-vector" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4 mr-2" />
                Tutorials
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r p-4 hidden md:block">
          <nav className="space-y-1">
            <Button
              variant={activeTab === "dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "nodes" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("nodes")}
            >
              <Server className="h-4 w-4 mr-2" />
              Nodes
            </Button>
            <Button
              variant={activeTab === "indexes" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("indexes")}
            >
              <Database className="h-4 w-4 mr-2" />
              Indexes
            </Button>
            <Button
              variant={activeTab === "query" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("query")}
            >
              <Search className="h-4 w-4 mr-2" />
              Query
            </Button>
            <Button
              variant={activeTab === "users" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
              disabled={!featuresAvailable.users}
              title={!featuresAvailable.users ? "User management not available" : ""}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
              {!featuresAvailable.users && <span className="ml-2 text-xs">(Unavailable)</span>}
            </Button>
            <Button
              variant={activeTab === "roles" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("roles")}
              disabled={!featuresAvailable.roles}
              title={!featuresAvailable.roles ? "Role management not available" : ""}
            >
              <Shield className="h-4 w-4 mr-2" />
              Roles
              {!featuresAvailable.roles && <span className="ml-2 text-xs">(Unavailable)</span>}
            </Button>
            <Button
              variant={activeTab === "config" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("config")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </Button>
          </nav>

          <div className="mt-8 pt-4 border-t">
            <div className="rounded-md bg-muted p-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Host:</span>
                  <span className="text-xs font-medium">127.0.0.1:5000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Cluster:</span>
                  <span className="text-xs font-medium">
                    {loading ? "Loading..." : clusterInfo?.activeCluster || "default"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Version:</span>
                  <span className="text-xs font-medium">
                    {loading ? "Loading..." : clusterInfo?.version || "AVS 1.1.0-RC1"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Size:</span>
                  <span className="text-xs font-medium">
                    {loading ? "Loading..." : `${clusterInfo?.clusterSize || 0} nodes`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "nodes" && <NodeListView />}
          {activeTab === "indexes" && <IndexListView />}
          {activeTab === "query" && <QueryView />}
          {activeTab === "users" && <UserListView />}
          {activeTab === "roles" && <RoleListView />}
          {activeTab === "config" && <ConfigView />}
        </div>
      </div>
    </div>
  )
}

