import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { LayoutGrid, Settings2 } from "lucide-react"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "text-sm font-medium transition-colors hover:text-primary"
        )}
      >
        Dashboard
      </Link>
      <Link
        href="/nodes"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "text-sm font-medium transition-colors hover:text-primary"
        )}
      >
        <LayoutGrid className="mr-2 h-4 w-4" />
        Nodes
      </Link>
      <Link
        href="/configuration"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "text-sm font-medium transition-colors hover:text-primary"
        )}
      >
        <Settings2 className="mr-2 h-4 w-4" />
        Configuration
      </Link>
    </nav>
  )
} 