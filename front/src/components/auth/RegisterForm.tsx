import { useState } from "react";
import { registerHelper } from "../../helpers/auth.helpers";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden",
        confirmButtonColor: "#14b8a6",
        background: "#0f172a",
        color: "#fff",
      });
      return;
    }

    setLoading(true);

    try {
      const data = await registerHelper(name, email, password);
      Swal.fire({
        icon: "success",
        title: "Registro exitoso",
        text: `Bienvenido, ${data.user.name}`,
        confirmButtonColor: "#14b8a6",
        background: "#0f172a",
        color: "#fff",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error en el registro",
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
      className="max-w-sm mx-auto p-6 rounded-lg shadow-lg bg-gradient-to-b from-purple-800 to-purple-900"
    >
      <h2 className="text-2xl font-bold text-center text-white mb-6">Registro</h2>

      {/* Nombre */}
      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-gray-400 p-2 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-white placeholder-gray-300"
        autoComplete="name"
      />

      {/* Email */}
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-400 p-2 w-full mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-white placeholder-gray-300"
        autoComplete="email"
      />

      {/* Contraseña */}
      <div className="relative mb-3">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-white placeholder-gray-300 pr-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-white"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Confirmar contraseña */}
      <div className="relative mb-5">
        <input
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border border-gray-400 p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 text-white placeholder-gray-300 pr-10"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-white"
        >
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Botón */}
      <button
        type="submit"
        disabled={loading}
        className="bg-teal-500 text-white font-medium p-2 rounded-lg w-full hover:bg-teal-600 disabled:opacity-50"
      >
        {loading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
}
