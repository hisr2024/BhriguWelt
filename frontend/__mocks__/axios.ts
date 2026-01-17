const create = jest.fn((config: Record<string, unknown> = {}) => ({
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

const axiosMock = { create };

export default axiosMock;
export { create };
