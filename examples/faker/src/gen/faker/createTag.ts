import type { Tag } from '../models/Tag.ts'
import { faker } from '@faker-js/faker'

export function createTag(data?: Partial<Tag>): Tag {
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...(data || {}),
  }
}
