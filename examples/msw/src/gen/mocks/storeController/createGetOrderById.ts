import type { GetOrderByIdPathParams, GetOrderByIdQueryResponse } from '../../models/GetOrderById.ts'
import { createOrder } from '../createOrder.ts'
import { faker } from '@faker-js/faker'

export function createGetOrderByIdPathParams(data?: Partial<GetOrderByIdPathParams>): GetOrderByIdPathParams {
  faker.seed([220])
  return {
    ...{ orderId: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createGetOrderById200() {
  faker.seed([220])
  return createOrder()
}

/**
 * @description Invalid ID supplied
 */
export function createGetOrderById400() {
  faker.seed([220])
  return undefined
}

/**
 * @description Order not found
 */
export function createGetOrderById404() {
  faker.seed([220])
  return undefined
}

export function createGetOrderByIdQueryResponse(data?: Partial<GetOrderByIdQueryResponse>): GetOrderByIdQueryResponse {
  faker.seed([220])
  return data || faker.helpers.arrayElement<any>([createGetOrderById200()])
}
