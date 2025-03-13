"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchIndexes } from "@/lib/api"
import { useEffect, useState } from "react"

interface IndexInfo {
  name: string
  namespace: string
  mode: string
  field: string
  dimensions: number
  unmergedPercent: string
  vectorRecords: number
  size: string
  status: string
  vertices: number
  labels: Record<string, string>
  storage: string
  parameters: Record<string, string>
}

export function IndexListView() {
  const [indexes, setIndexes] = useState<IndexInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeNamespace, setActiveNamespace] = useState<string | null>(null)

  useEffect(() => {
    const loadIndexes = async () => {
      try {
        setLoading(true)
        const data = await fetchIndexes()
        setIndexes(Array.isArray(data) ? data : [])
        setError(null)
      } catch (err) {
        console.error('Failed to load indexes:', err)
        setError(err instanceof Error ? err.message : 'Failed to load indexes')
        setIndexes([])
      } finally {
        setLoading(false)
      }
    }

    loadIndexes()
  }, [])

  // Get unique namespaces
  const namespaces = Array.from(new Set(indexes.map(index => index.namespace)))

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Indexes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="tabs">
            <span className="font-semibold">Namespace(s):</span>
            {namespaces.map(namespace => (
              <button
                key={namespace}
                className={`tab ${activeNamespace === namespace ? 'active' : ''}`}
                onClick={() => setActiveNamespace(namespace)}
              >
                {namespace}
              </button>
            ))}
          </div>
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="border-b py-2 px-4">Name</th>
                <th className="border-b py-2 px-4">Mode</th>
                <th className="border-b py-2 px-4">Field</th>
                <th className="border-b py-2 px-4">Dimensions</th>
                <th className="border-b py-2 px-4">Unmerged %</th>
                <th className="border-b py-2 px-4">Vector Count</th>
                <th className="border-b py-2 px-4">Size</th>
                <th className="border-b py-2 px-4">Status</th>
                <th className="border-b py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {indexes.filter(index => activeNamespace === null || index.namespace === activeNamespace).map((index, i) => (
                <tr key={i} className="hover:bg-gray-100">
                  <td className="border-b py-2 px-4">{index.name}</td>
                  <td className="border-b py-2 px-4">{index.mode}</td>
                  <td className="border-b py-2 px-4">{index.field}</td>
                  <td className="border-b py-2 px-4">{index.dimensions}</td>
                  <td className="border-b py-2 px-4">{index.unmergedPercent}</td>
                  <td className="border-b py-2 px-4">{index.vectorRecords}</td>
                  <td className="border-b py-2 px-4">{index.size}</td>
                  <td className="border-b py-2 px-4">
                    <span className={`font-semibold ${index.status === 'READY' ? 'text-green-500' : ''}`}>
                      {index.status}
                    </span>
                  </td>
                  <td className="border-b py-2 px-4">
                    <button className="btn-edit">Edit</button>
                    <button className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="border-b py-2 px-4 font-bold" colSpan={5}>Total</td>
                <td className="border-b py-2 px-4 font-bold">{indexes.reduce((total, index) => total + index.vectorRecords, 0)}</td>
                <td className="border-b py-2 px-4 font-bold">{indexes.reduce((total, index) => {
                  const sizeInGB = parseFloat(index.size.replace(" GB", ""));
                  return total + (isNaN(sizeInGB) ? 0 : sizeInGB);
                }, 0).toFixed(2)} GB</td>
                <td className="border-b py-2 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}