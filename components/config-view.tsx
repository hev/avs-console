"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload, Loader2, Check, X } from "lucide-react"
import { fetchConfig, updateConfig, uploadTLSFile, type ConfigInfo } from "@/lib/api"

export function ConfigView() {
  const [config, setConfig] = useState<ConfigInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true)
        const data = await fetchConfig()
        setConfig(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load configuration")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [])

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription className="text-red-500">Error: {error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>Current configuration settings for AVS Console</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Active Configuration</h3>
          <div className="rounded-md border p-4 space-y-2">
            {loading ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Configuration File:</span>
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Connection:</span>
                  <Skeleton className="h-4 w-48" />
                </div>
              </>
            ) : (
              config && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Configuration File:</span>
                    <span className="text-sm text-muted-foreground font-mono">{config.configFile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Connection:</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {config.seeds ? (
                        <>Seeds: {config.seeds}</>
                      ) : config.host ? (
                        <>Host: {config.host}</>
                      ) : (
                        "Not configured"
                      )}
                    </span>
                  </div>
                </>
              )
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">CLI Status</h3>
          </div>
          <div className="rounded-md border p-4">
            {loading ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              config && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {config.cliInstalled ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {config.cliInstalled
                        ? `CLI installed (version ${config.cliVersion})`
                        : "CLI not installed"}
                    </span>
                  </div>
                  {!config.cliInstalled && (
                    <div className="text-sm text-muted-foreground">
                      Please install the asvec CLI from{" "}
                      <a
                        href={config.cliDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        GitHub
                      </a>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

