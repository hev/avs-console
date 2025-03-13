"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchIndexes, fetchNodes, fetchConfig } from "@/lib/api"
import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface IndexInfo {
  name: string
  mode: string
  status: string
  unmerged: number // Ensure this is the correct type
  vectorRecords: number
  size: string
  unmergedPercent: string // Ensure this is the correct type
}

export function DashboardView() {
  const [nodeRoles, setNodeRoles] = useState<string[]>([])
  const [indexes, setIndexes] = useState<IndexInfo[]>([]) // Adjust type as needed
  const [nodes, setNodes] = useState<any[]>([]) // Adjust type as needed
  const [config, setConfig] = useState<any>(null) // State for configuration
  const [loading, setLoading] = useState<boolean>(true)
  const [connectionError, setConnectionError] = useState<boolean>(false)
  const [serverStatus, setServerStatus] = useState<string>("Disconnected") // Initialize as Disconnected

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setConnectionError(false)

        // Fetch configuration first
        const configData = await fetchConfig() // Fetch the configuration data
        setConfig(configData) // Set the configuration data

        // Fetch nodes to get roles
        const nodesData = await fetchNodes()
        setNodes(Array.isArray(nodesData) ? nodesData : [])
        setNodeRoles(Array.isArray(nodesData) ? Array.from(new Set(nodesData.map(node => node.role))) : [])

        // Fetch indexes
        const indexesData = await fetchIndexes()
        setIndexes(Array.isArray(indexesData) ? indexesData : [])

        // If we reach this point, the server is connected
        setServerStatus("Connected");

      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setConnectionError(true)
        setNodeRoles([]) // Reset roles on error
        setIndexes([]) // Reset indexes on error
        setConfig(null) // Reset config on error
        setServerStatus("Disconnected"); // Set status to Disconnected on error
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate totals
  const totalVectorCount = indexes.reduce((total, index) => total + index.vectorRecords, 0)
  const totalUnmerged = indexes.reduce((total, index) => total + index.unmerged, 0) // Use the correct field
  const totalIndexes = indexes.length

  const modeCount = indexes.reduce((acc, index) => {
    acc[index.mode] = (acc[index.mode] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusCount = indexes.reduce((acc, index) => {
    acc[index.status] = (acc[index.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalNodeCount = nodes.length

  // Determine server version
  const serverVersion = nodes.length > 0 ? nodes[0].version : "N/A"
  const serverHost = config?.host || "N/A"

  // Calculate total unmerged percentage
  const totalUnmergedPercent = totalVectorCount > 0 ? (totalUnmerged / totalVectorCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {connectionError && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <p>Unable to connect to Aerospike cluster. Please check your configuration.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>AVS Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg ${serverStatus === "Connected" ? "text-green-500" : "text-red-500"}`}>
              {serverStatus}
            </p>
            <p>Version: {serverVersion}</p>
            <div className="flex justify-between">
              <p>
                {config?.seeds ? (
                  <>Seeds: {config.seeds} (no load-balancer)</>
                ) : serverHost !== "N/A" ? (
                  <>Host: {serverHost} (single node or load-balancer)</>
                ) : (
                  "Not configured"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Vector Count {totalVectorCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Across all indexes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Unmerged {totalUnmerged.toFixed(2)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Across all indexes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Number of Indexes {totalIndexes}</CardTitle>
          </CardHeader>
          <CardContent>
            
            {Object.entries(modeCount).map(([mode, count]) => (
              <p key={mode}>{mode}: {count}</p>
            ))}
            
            {Object.entries(statusCount).map(([status, count]) => (
              <p key={status}>{status}: {count}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Node Count {totalNodeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Node Roles:</p>
            {nodeRoles.length > 0 ? (
              nodeRoles.map((role, index) => (
                <span key={index} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {role}
                </span>
              ))
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                N/A
              </span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

