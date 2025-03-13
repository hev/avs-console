"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Key, Loader2 } from "lucide-react"
import { executeQuery, type QueryResult } from "@/lib/api"

export function QueryView() {
  const [queryType, setQueryType] = useState<"vector" | "key">("vector")
  const [vector, setVector] = useState("[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]")
  const [key, setKey] = useState("doc123")
  const [index, setIndex] = useState("products")
  const [limit, setLimit] = useState("5")
  const [threshold, setThreshold] = useState("0.7")

  const [results, setResults] = useState<QueryResult[]>([])
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExecuteQuery = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryData =
        queryType === "vector"
          ? {
              type: "vector",
              vector: JSON.parse(vector),
              index,
              limit: Number.parseInt(limit),
              threshold: Number.parseFloat(threshold),
            }
          : {
              type: "key",
              key,
              index,
            }

      const response = await executeQuery(queryData)
      setResults(response.results)
      setExecutionTime(response.executionTime)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute query")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vector Search Query</CardTitle>
        <CardDescription>Execute vector search queries against your data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          defaultValue="vector"
          className="w-full"
          onValueChange={(value) => setQueryType(value as "vector" | "key")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vector">
              <Search className="h-4 w-4 mr-2" />
              Vector Search
            </TabsTrigger>
            <TabsTrigger value="key">
              <Key className="h-4 w-4 mr-2" />
              Key Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vector" className="space-y-4 pt-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vector</label>
                  <Textarea
                    placeholder="Enter your vector values as a JSON array. Example: [0.1, 0.2, 0.3, 0.4]"
                    className="font-mono text-sm h-24"
                    value={vector}
                    onChange={(e) => setVector(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Index</label>
                  <Input value={index} onChange={(e) => setIndex(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Limit</label>
                  <Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Threshold</label>
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    step="0.1"
                    min="0"
                    max="1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="key" className="space-y-4 pt-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Key</label>
                  <Input
                    placeholder="Enter the document key"
                    className="font-mono text-sm"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Index</label>
                  <Input value={index} onChange={(e) => setIndex(e.target.value)} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={handleExecuteQuery} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Execute Query
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {(results.length > 0 || loading) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Results</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Similarity</TableHead>
                    <TableHead>Metadata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? // Loading skeleton
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <Skeleton className="h-6 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-48" />
                          </TableCell>
                        </TableRow>
                      ))
                    : // Actual results
                      results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium font-mono">{result.id}</TableCell>
                          <TableCell>{result.similarity.toFixed(2)}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted p-1 rounded">{result.metadata}</code>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
      {executionTime !== null && (
        <CardFooter className="text-sm text-muted-foreground">Query execution time: {executionTime}s</CardFooter>
      )}
    </Card>
  )
}

