import { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

export default function HomePage() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-gradient-to-r from-slate-900 via-violet-900 to-fuchsia-900">
      {/* Columna izquierda */}
      <aside className="flex items-center justify-center p-8 text-white">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
          <p className="text-white/80">
            Please sign-in to your account and start the adventure
          </p>
        </div>
      </aside>

      {/* Columna derecha */}
      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {showRegister ? <RegisterForm /> : <LoginForm />}

          <div className="mt-5 text-center">
            {showRegister ? (
              <>
                <span className="text-sm text-gray-200 mr-2">¿Ya tienes cuenta?</span>
                <button
                  onClick={() => setShowRegister(false)}
                  className="inline-block rounded-md px-4 py-2 bg-teal-500 hover:bg-teal-400 text-gray-900 font-medium transition"
                >
                  Iniciar sesión
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-200 mr-2">¿No tienes cuenta?</span>
                <button
                  onClick={() => setShowRegister(true)}
                  className="inline-block rounded-md px-4 py-2 bg-teal-500 hover:bg-teal-400 text-gray-900 font-medium transition"
                >
                  Crear cuenta
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
