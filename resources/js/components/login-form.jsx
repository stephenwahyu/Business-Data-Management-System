import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AppearanceToggleTab from "@/components/appearance-tabs"
import { Separator } from "@/components/ui/separator"


export function LoginForm({ className, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  
  const { data, setData, post, processing, errors } = useForm({
    email: "",
    password: "",
    remember: false,
  });

  function submit(e) {
    e.preventDefault();
    post("/login");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <div className="flex flex-col gap-6">
              {errors.email && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{errors.email}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com"
                  value={data.email}
                  onChange={e => setData("email", e.target.value)}
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {/* <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a> */}
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={data.password}
                    onChange={e => setData("password", e.target.value)}
                    required 
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <div className="block sm:flex sm:justify-between items-center justify-center">
                  <div className="flex gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={data.remember}
                      onChange={e => setData("remember", e.target.checked)}
                    />
                    <Label htmlFor="remember" className="text-sm">Remember me</Label>
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? "Loading..." : "Login"}
              </Button>
              
              {/* <Button variant="outline" className="w-full" onClick={() => window.location.href = "/auth/google"}>
                Login with Google
              </Button> */}
            </div>
            
            {/* <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div> */}
          </form>
            <Separator className='my-2'/>

          <div className="flex justify-center">
            <AppearanceToggleTab />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}