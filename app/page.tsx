"use client"

import AerospikeVectorSearch from "../aerospike-vector-search"
import { Suspense } from "react"
import { fetchClusterInfo } from "@/lib/api"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import { Overview } from "@/components/overview"
import { CardSkeleton } from "@/components/loading-skeleton"
import { DashboardView } from "@/components/dashboard-view"

export default function SyntheticV0PageForDeployment() {
  return <AerospikeVectorSearch />
}

export function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardView />
    </DashboardShell>
  )
}