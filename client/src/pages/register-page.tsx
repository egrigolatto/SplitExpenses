import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";

import { env } from "../config/env";
import { useRegisterMutation } from "../hooks/use-session";
import { registerRequestSchema, type RegisterRequest } from "../schemas/auth.schema";
import { ApiRequestError } from "../services/http-client";
import { Button } from "../components/ui/button";
import { buttonClass } from "../components/ui/button-styles";
import { Card } from "../components/ui/card";
import { Field } from "../components/ui/field";
import { Input } from "../components/ui/input";

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
      <Card className="flex flex-col gap-5 p-6">
        <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field htmlFor="register-name" label="Nombre" error={errors.name?.message}>
            <Input
              id="register-name"
              autoComplete="name"
              invalid={errors.name !== undefined}
              aria-invalid={errors.name !== undefined}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              className="w-full"
              {...register("name")}
            />
          </Field>

          <Field htmlFor="register-email" label="Email" error={errors.email?.message}>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              invalid={errors.email !== undefined}
              aria-invalid={errors.email !== undefined}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              className="w-full"
              {...register("email")}
            />
          </Field>

          <Field htmlFor="register-password" label="Contraseña" error={errors.password?.message}>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              invalid={errors.password !== undefined}
              aria-invalid={errors.password !== undefined}
              aria-describedby={errors.password ? "register-password-error" : undefined}
              className="w-full"
              {...register("password")}
            />
          </Field>

          {registerAccount.error !== null && (
            <p role="alert" className="text-sm text-rose-600">
              {describeError(registerAccount.error)}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={registerAccount.isPending}
          >
            {registerAccount.isPending ? "Creando cuenta..." : "Crear cuenta"}
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
        ¿Ya tenés cuenta?{" "}
        <Link
          to="/login"
          className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
        >
          Iniciar sesión
        </Link>
      </p>
    </section>
  );
}
