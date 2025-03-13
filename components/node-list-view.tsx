"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchNodes } from "@/lib/api"
import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

interface Node {
  nodeId: string
  role: string
  endpoint: string
  version: string
}

export function NodeListView() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadNodes = async () => {
      try {
        setLoading(true)
        const data = await fetchNodes()
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid response from server')
        }
        setNodes(data)
        setError(null)
      } catch (err) {
        console.error('Failed to load nodes:', err)
        setError(err instanceof Error ? err.message : 'Failed to load nodes')
        setNodes([]) // Clear any existing nodes data
      } finally {
        setLoading(false)
      }
    }

    loadNodes()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || nodes.length === 0) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Unable to connect to Aerospike cluster</p>
              <p className="text-sm text-red-400 mt-1">
                {error || "No nodes found. Please check your configuration and ensure the cluster is running"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nodes ({nodes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted">
              <tr>
                <th scope="col" className="px-6 py-3">Node ID</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Endpoint</th>
                <th scope="col" className="px-6 py-3">Version</th>
                <th scope="col" className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node, index) => (
                <tr key={index} className="bg-card border-b">
                  <td className="px-6 py-4 font-mono">{node.nodeId}</td>
                  <td className="px-6 py-4">{node.role || 'N/A'}</td>
                  <td className="px-6 py-4 font-mono">{node.endpoint}</td>
                  <td className="px-6 py-4">{node.version}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Connected
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

