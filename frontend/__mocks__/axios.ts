const create = jest.fn((config: Record<string, any> = {}) => ({
  defaults: {
    baseURL: config.baseURL,
    headers: config.headers ?? {},
    timeout: config.timeout,
    withCredentials: config.withCredentials,
  },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

export default { create };
export { create };
