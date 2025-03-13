import { MainNav } from "@/components/main-nav"

export function Header() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="font-bold text-2xl mr-8">AVS Console</div>
        <MainNav className="mx-6" />
      </div>
    </div>
  )
} 