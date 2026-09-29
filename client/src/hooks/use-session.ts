import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { LoginRequest, RegisterRequest } from "../schemas/auth.schema";
import type { PublicUser } from "../schemas/user.schema";
import { authService } from "../services/auth.service";

export const SESSION_QUERY_KEY = ["auth", "session"] as const;

export function useSession() {
  const { data, isPending } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => authService.me(),
  });

  return { user: data ?? null, isLoading: isPending };
}

export function useLoginMutation() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginRequest) => authService.login(input),
    onSuccess: (session) => {
      client.setQueryData(SESSION_QUERY_KEY, session.user satisfies PublicUser);
    },
  });
}

export function useRegisterMutation() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterRequest) => authService.register(input),
    onSuccess: (user) => {
      client.setQueryData(SESSION_QUERY_KEY, user satisfies PublicUser);
    },
  });
}

export function useLogoutMutation() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      client.setQueryData(SESSION_QUERY_KEY, null);
    },
  });
}
