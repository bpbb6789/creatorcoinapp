import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { CreateCoinForm } from "@/components/create-coin-form"
import { CreateCoinModal } from "@/components/create-coin-modal"

export default function CreatePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="md:ml-64 flex-1 pb-16 md:pb-0">
        <Header />
        <main className="p-4 md:p-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 md:mb-8">
              <h1 className="mb-2 text-2xl md:text-3xl font-bold text-foreground">Create a Creator Coin</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Deploy your own ERC20 token on Base with Zora protocol integration
              </p>
            </div>
            <div className="mb-6 flex justify-center">
              <CreateCoinModal />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or use the simple form</span>
              </div>
            </div>
            <div className="mt-6">
              <CreateCoinForm />
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
