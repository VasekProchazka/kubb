import client from '../../../client'

import type { LoginUserResponse, LoginUserQueryParams } from '../../models/ts/LoginUser'

/**
 * @summary Logs user into the system
 * @link /user/login
 */
export const loginUser = <TData = LoginUserResponse>(params?: LoginUserQueryParams) => {
  return client<TData>({
    method: 'get',
    url: `/user/login`,
    params,
  })
}
