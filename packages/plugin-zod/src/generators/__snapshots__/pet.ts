import { z } from 'zod'

export const pet = z.object({
  id: z.number().int(),
  name: z.string(),
  date: z.date().optional(),
  uuid: z.string().uuid().optional(),
  email: z.string().email().optional(),
  pattern: z.string().regex(new RegExp('^[a-zA-Z0-9]{3}$')).optional(),
  tag: z.string().min(5).max(100).optional(),
})
