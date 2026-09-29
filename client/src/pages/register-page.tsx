import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";

import { env } from "../config/env";
import { useRegisterMutation } from "../hooks/use-session";
import { registerRequestSchema, type RegisterRequest } from "../schemas/auth.schema";
import { ApiRequestError } from "../services/http-client";

const inputClass =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1";

function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) {
      return "Ese email ya está registrado";
    }

    if (error.status === 400) {
      return "Revisá los datos ingresados";
    }

    if (error.status === 0) {
      return "No se pudo conectar con el servidor";
    }
  }

  return "No se pudo crear la cuenta. Intentá de nuevo";
}

export function RegisterPage() {
  const navigate = useNavigate();
  const registerAccount = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerRequestSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  function onSubmit(values: RegisterRequest) {
    registerAccount.mutate(values, { onSuccess: () => navigate("/") });
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="register-name" className="text-sm font-medium">
            Nombre
          </label>
          <input
            id="register-name"
            autoComplete="name"
            aria-invalid={errors.name !== undefined}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            className={inputClass}
            {...register("name")}
          />
          {errors.name !== undefined && (
            <p id="register-name-error" role="alert" className="text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="register-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            className={inputClass}
            {...register("email")}
          />
          {errors.email !== undefined && (
            <p id="register-email-error" role="alert" className="text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="register-password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password !== undefined}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            className={inputClass}
            {...register("password")}
          />
          {errors.password !== undefined && (
            <p id="register-password-error" role="alert" className="text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {registerAccount.error !== null && (
          <p role="alert" className="text-sm text-red-600">
            {describeError(registerAccount.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={registerAccount.isPending}
          className="rounded bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        >
          {registerAccount.isPending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <a
        href={`${env.VITE_API_URL}/api/v1/auth/google`}
        className="rounded border border-neutral-300 bg-white px-6 py-2.5 text-center text-sm font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-1"
      >
        Continuar con Google
      </a>

      <p className="text-sm text-neutral-600">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="font-medium underline">
          Iniciar sesión
        </Link>
      </p>
    </section>
  );
}
