import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";

import { useLoginMutation } from "../hooks/use-session";
import { loginRequestSchema, type LoginRequest } from "../schemas/auth.schema";
import { env } from "../config/env";
import { ApiRequestError } from "../services/http-client";

const inputClass =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1";

function describeError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) {
      return "Email o contraseña incorrectos";
    }

    if (error.status === 0) {
      return "No se pudo conectar con el servidor";
    }
  }

  return "No se pudo iniciar sesión. Intentá de nuevo";
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginRequest) {
    login.mutate(values, { onSuccess: () => navigate("/") });
  }

  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            className={inputClass}
            {...register("email")}
          />
          {errors.email !== undefined && (
            <p id="login-email-error" role="alert" className="text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password !== undefined}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className={inputClass}
            {...register("password")}
          />
          {errors.password !== undefined && (
            <p id="login-password-error" role="alert" className="text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {login.error !== null && (
          <p role="alert" className="text-sm text-red-600">
            {describeError(login.error)}
          </p>
        )}

        <button
          type="submit"
          disabled={login.isPending}
          className="rounded bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        >
          {login.isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <a
        href={`${env.VITE_API_URL}/api/v1/auth/google`}
        className="rounded border border-neutral-300 bg-white px-6 py-2.5 text-center text-sm font-medium hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-1"
      >
        Continuar con Google
      </a>

      <p className="text-sm text-neutral-600">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="font-medium underline">
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
