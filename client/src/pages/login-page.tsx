import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";

import { useLoginMutation } from "../hooks/use-session";
import { loginRequestSchema, type LoginRequest } from "../schemas/auth.schema";
import { env } from "../config/env";
import { ApiRequestError } from "../services/http-client";
import { Button } from "../components/ui/button";
import { buttonClass } from "../components/ui/button-styles";
import { Card } from "../components/ui/card";
import { Field } from "../components/ui/field";
import { Input } from "../components/ui/input";

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
      <Card className="flex flex-col gap-5 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field htmlFor="login-email" label="Email" error={errors.email?.message}>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              invalid={errors.email !== undefined}
              aria-invalid={errors.email !== undefined}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className="w-full"
              {...register("email")}
            />
          </Field>

          <Field htmlFor="login-password" label="Contraseña" error={errors.password?.message}>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              invalid={errors.password !== undefined}
              aria-invalid={errors.password !== undefined}
              aria-describedby={errors.password ? "login-password-error" : undefined}
              className="w-full"
              {...register("password")}
            />
          </Field>

          {login.error !== null && (
            <p role="alert" className="text-sm text-rose-600">
              {describeError(login.error)}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <a
          href={`${env.VITE_API_URL}/api/v1/auth/google`}
          className={buttonClass("secondary", "md", "w-full")}
        >
          Continuar con Google
        </a>
      </Card>

      <p className="text-center text-sm text-neutral-600">
        ¿No tenés cuenta?{" "}
        <Link
          to="/register"
          className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
        >
          Crear cuenta
        </Link>
      </p>
    </section>
  );
}
