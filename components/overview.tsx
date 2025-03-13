"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchClusterInfo } from "@/lib/api"
import { useEffect, useState } from "react"

export function Overview() {
  const [clusterInfo, setClusterInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadClusterInfo = async () => {
      try {
        const info = await fetchClusterInfo()
        setClusterInfo(info)
      } catch (err) {
        console.error('Failed to load cluster info:', err)
        setError(err instanceof Error ? err.message : 'Failed to load cluster info')
      }
    }

    loadClusterInfo()
  }, [])

  if (error) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">{error}</p>
          </CardContent>
        </Card>
      </>
    )
  }

  if (!clusterInfo) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Cluster Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Vectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Node Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Loading...</div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cluster Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clusterInfo.clusterSize || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Vectors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clusterInfo.totalVectors || 0}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Node Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Array.isArray(clusterInfo.nodeRoles) ? clusterInfo.nodeRoles.length : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {Array.isArray(clusterInfo.nodeRoles) 
              ? clusterInfo.nodeRoles.join(", ") 
              : "No roles available"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Version</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clusterInfo.version || "Unknown"}</div>
        </CardContent>
      </Card>
    </>
  )
} 