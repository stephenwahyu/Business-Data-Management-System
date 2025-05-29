import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      {/* Theme toggle positioned at top-right */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6">
        
      </div>
      
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
      
    </div>
  )
}