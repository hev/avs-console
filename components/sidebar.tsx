"use client"

import { cn } from "@/lib/utils"
import { Link } from "react-router-dom" // Adjust based on your routing library

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
    return (
        <div className={cn("flex flex-col", className)}>
            <nav className="py-4">
                <ul className="space-y-2">
                    <li>
                        <Link to="/" className="text-lg font-semibold">Home</Link>
                    </li>
                    <li>
                        <Link to="/nodes" className="text-lg font-semibold">Nodes</Link>
                    </li>
                    <li>
                        <Link to="/indexes" className="text-lg font-semibold">Indexes</Link>
                    </li>
                    {/* Add more navigation links as needed */}
                </ul>
            </nav>
        </div>
    )
} 