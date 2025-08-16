import { useState } from "react";
import { loginHelper } from "../../helpers/auth.helpers";
import Swal from "sweetalert2";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await loginHelper(email, password);

      // ✅ Guardamos en sessionStorage para que sea por pestaña
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      Swal.fire({
        icon: "success",
        title: "Inicio de sesión exitoso",
        text: `Bienvenido, ${data.user.name}`,
        confirmButtonColor: "#14b8a6",
        background: "#0f172a",
        color: "#fff",
      }).then(() => {
        // ✅ Redirigir a /chat después de aceptar
        window.location.href = "/chat";
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error en el inicio de sesión",
        text: err instanceof Error ? err.message : "Error desconocido",
        confirmButtonColor: "#14b8a6",
        background: "#0f172a",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto p-6 rounded-lg shadow-lg bg-gradient-to-b from-purple-800 to-purple-900"
    >
      <h2 className="text-2xl font-bold text-center text-white mb-6">
        Iniciar Sesión
      </h2>

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-400 p-3 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-white placeholder-gray-300"
        autoComplete="email"
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-400 p-3 w-full mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-white placeholder-gray-300"
        autoComplete="current-password"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
