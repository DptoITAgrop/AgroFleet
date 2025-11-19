import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-md">
        <LoginForm />

        {/* 👇 Aquí añadimos el enlace */}
        <p className="text-center text-sm mt-4 text-gray-700">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
