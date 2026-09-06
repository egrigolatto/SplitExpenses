import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { createUserSchema, updateUserSchema } from "../schemas/user.schema.js";
import { loginSchema } from "../schemas/auth.schema.js";
import {
  createMeetingSchema,
  listMeetingsQuerySchema,
  updateMeetingSchema,
} from "../schemas/meeting.schema.js";
import { API_VERSION } from "../routes/api.routes.js";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "access_token",
});

const errorSchema = registry.register(
  "Error",
  z.object({
    success: z.literal(false),
    message: z.string(),
    errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
  }),
);

const userSchema = registry.register(
  "User",
  z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    googleId: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const participantResponseSchema = registry.register(
  "Participant",
  z.object({
    id: z.uuid(),
    meetingId: z.uuid(),
    userId: z.uuid().nullable(),
    name: z.string(),
    paidAmount: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const meetingSchema = registry.register(
  "Meeting",
  z.object({
    id: z.uuid(),
    ownerId: z.uuid(),
    name: z.string(),
    meetingDate: z.string(),
    totalAmount: z.number(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    participants: z.array(participantResponseSchema),
  }),
);

const createdMeetingSchema = registry.register(
  "CreatedMeeting",
  z.object({
    meeting: meetingSchema,
    participants: z.array(participantResponseSchema),
  }),
);

const paginatedMeetingsSchema = registry.register(
  "PaginatedMeetings",
  z.object({
    items: z.array(meetingSchema),
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
);

function successResponse(data: z.ZodType, description = "OK") {
  return {
    description,
    content: {
      "application/json": {
        schema: z.object({ success: z.literal(true), data }),
      },
    },
  };
}

const errorResponses = {
  400: {
    description: "Validation error",
    content: { "application/json": { schema: errorSchema } },
  },
  401: {
    description: "Unauthorized",
    content: { "application/json": { schema: errorSchema } },
  },
  404: {
    description: "Not found",
    content: { "application/json": { schema: errorSchema } },
  },
  409: {
    description: "Conflict",
    content: { "application/json": { schema: errorSchema } },
  },
};

const authed = [{ cookieAuth: [] }];

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: { content: { "application/json": { schema: createUserSchema } } },
  },
  responses: {
    201: successResponse(userSchema, "User created. Sets access and refresh cookies."),
    400: errorResponses[400],
    409: errorResponses[409],
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login with email and password",
  request: {
    body: { content: { "application/json": { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: "Login successful. Sets access and refresh cookies.",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({ user: userSchema, accessToken: z.string() }),
          }),
        },
      },
    },
    400: errorResponses[400],
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh the access token",
  description:
    "Uses the HttpOnly refresh cookie. Rotates the refresh token on each use. " +
    "Reuse of an already rotated token within the 10s grace window reissues the access token; " +
    "reuse outside the window revokes the whole token family.",
  responses: {
    200: {
      description: "New access token issued. Refresh cookie is rotated.",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({ user: userSchema, accessToken: z.string() }),
          }),
        },
      },
    },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  security: authed,
  summary: "Logout and revoke the refresh token",
  responses: {
    200: {
      description: "Cookies cleared and refresh token revoked.",
      content: {
        "application/json": { schema: z.object({ success: z.literal(true) }) },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  security: authed,
  summary: "Get the authenticated user",
  responses: {
    200: successResponse(userSchema),
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/google",
  tags: ["Auth"],
  summary: "Redirect to the Google OAuth flow",
  responses: {
    302: { description: "Redirect to Google consent screen" },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/google/callback",
  tags: ["Auth"],
  summary: "Google OAuth callback",
  request: { query: z.object({ code: z.string().optional() }) },
  responses: {
    302: { description: "Redirects to the frontend with auth cookies set" },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "patch",
  path: "/users/me",
  tags: ["Users"],
  security: authed,
  summary: "Update the authenticated user profile",
  request: {
    body: { content: { "application/json": { schema: updateUserSchema } } },
  },
  responses: {
    200: successResponse(userSchema),
    400: errorResponses[400],
    401: errorResponses[401],
    409: errorResponses[409],
  },
});

registry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["Users"],
  security: authed,
  summary: "Get a user by id",
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: successResponse(userSchema),
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "post",
  path: "/meetings",
  tags: ["Meetings"],
  security: authed,
  summary: "Create a meeting",
  request: {
    body: { content: { "application/json": { schema: createMeetingSchema } } },
  },
  responses: {
    201: successResponse(createdMeetingSchema),
    400: errorResponses[400],
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "get",
  path: "/meetings",
  tags: ["Meetings"],
  security: authed,
  summary: "List meetings of the authenticated user (paginated)",
  request: { query: listMeetingsQuerySchema },
  responses: {
    200: successResponse(paginatedMeetingsSchema),
    400: errorResponses[400],
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "get",
  path: "/meetings/{id}",
  tags: ["Meetings"],
  security: authed,
  summary: "Get a meeting by id",
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    200: successResponse(meetingSchema),
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "patch",
  path: "/meetings/{id}",
  tags: ["Meetings"],
  security: authed,
  summary: "Update a meeting",
  request: {
    params: z.object({ id: z.uuid() }),
    body: { content: { "application/json": { schema: updateMeetingSchema } } },
  },
  responses: {
    200: successResponse(meetingSchema),
    400: errorResponses[400],
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "delete",
  path: "/meetings/{id}",
  tags: ["Meetings"],
  security: authed,
  summary: "Delete a meeting",
  request: { params: z.object({ id: z.uuid() }) },
  responses: {
    204: { description: "Meeting deleted" },
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Split Expenses API",
      version: API_VERSION,
      description:
        "API for splitting expenses between people. All successful responses are wrapped in `{ success: true, data }`.",
    },
    servers: [{ url: `/api/${API_VERSION}` }],
  });
}
