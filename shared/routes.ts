import { z } from 'zod';
import { insertProfileSchema, insertServiceSchema, insertReviewSchema, insertMessageSchema, profiles, services, reviews, messages, notifications } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  profiles: {
    list: {
      method: 'GET' as const,
      path: '/api/profiles',
      input: z.object({
        services: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
          if (!val) return undefined;
          return Array.isArray(val) ? val : [val];
        }),
        locationTypes: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
          if (!val) return undefined;
          return Array.isArray(val) ? val : [val];
        }),
        search: z.string().optional(),
        lat: z.coerce.number().optional(),
        lng: z.coerce.number().optional(),
        radius: z.coerce.number().optional(), // km
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect & { services: typeof services.$inferSelect[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:id',
      responses: {
        200: z.custom<typeof profiles.$inferSelect & { services: typeof services.$inferSelect[], reviews: typeof reviews.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/me',
      input: insertProfileSchema.omit({ userId: true, username: true }).partial(), // Can't change username/userId easily
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    checkUsername: {
        method: 'POST' as const,
        path: '/api/profiles/check-username',
        input: z.object({ username: z.string() }),
        responses: {
            200: z.object({ available: z.boolean() }),
        }
    },
    create: {
        method: 'POST' as const,
        path: '/api/profiles',
        input: insertProfileSchema.omit({ userId: true }),
        responses: {
            201: z.custom<typeof profiles.$inferSelect>(),
            400: errorSchemas.validation,
            409: z.object({ message: z.string() }) // Conflict (username)
        }
    },
    delete: {
        method: 'DELETE' as const,
        path: '/api/profiles/me',
        responses: {
            204: z.void(),
            401: errorSchemas.unauthorized,
        }
    },
    updateUsername: {
        method: 'PUT' as const,
        path: '/api/profiles/me/username',
        input: z.object({ username: z.string().min(3).max(30) }),
        responses: {
            200: z.custom<typeof profiles.$inferSelect>(),
            401: errorSchemas.unauthorized,
            409: z.object({ message: z.string() }) // Username taken
        }
    }
  },
  services: {
    list: {
        method: 'GET' as const,
        path: '/api/services',
        input: z.object({ providerId: z.coerce.number() }),
        responses: {
            200: z.array(z.custom<typeof services.$inferSelect>())
        }
    },
    create: {
      method: 'POST' as const,
      path: '/api/services',
      input: insertServiceSchema,
      responses: {
        201: z.custom<typeof services.$inferSelect>(),
        401: errorSchemas.unauthorized,
        409: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/services/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages',
      input: z.object({ otherUserId: z.coerce.number().optional() }).optional(), // If provided, gets conversation. If not, gets list of conversations.
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/messages',
      input: z.object({ receiverId: z.number(), content: z.string() }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/messages/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
    deleteConversation: {
      method: 'DELETE' as const,
      path: '/api/messages/conversation/:otherUserId',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  reviews: {
    create: {
      method: 'POST' as const,
      path: '/api/reviews',
      input: insertReviewSchema.omit({ clientId: true }),
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        401: errorSchemas.unauthorized,
        409: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reviews/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        403: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    checkExisting: {
      method: 'GET' as const,
      path: '/api/reviews/check/:providerId',
      responses: {
        200: z.object({ hasReviewed: z.boolean(), reviewId: z.number().optional() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications',
      responses: {
        200: z.array(z.custom<typeof notifications.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/notifications/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/notifications',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
    markRead: {
      method: 'PUT' as const,
      path: '/api/notifications/:id/read',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
