import axios from 'axios'

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/v1/auth/refresh`, { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (d) => api.post('/auth/register', d),
  login: (d) => api.post('/auth/login', d),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email, code) => api.post('/auth/verify-otp', { email, code }),
  resetPassword: (email, code, new_password) => api.post('/auth/reset-password', { email, code, new_password }),
}

export const smesApi = {
  list: (p) => api.get('/smes/', { params: p }),
  get: (id) => api.get(`/smes/${id}`),
  create: (d) => api.post('/smes/', d),
  update: (id, d) => api.patch(`/smes/${id}`, d),
  delete: (id) => api.delete(`/smes/${id}`),
  sectors: () => api.get('/smes/sectors'),
}

export const transactionsApi = {
  list: (smeId, p) => api.get(`/smes/${smeId}/transactions/`, { params: p }),
  add: (smeId, d) => api.post(`/smes/${smeId}/transactions/`, d),
  bulk: (smeId, d) => api.post(`/smes/${smeId}/transactions/bulk`, d),
  summary: (smeId) => api.get(`/smes/${smeId}/transactions/summary`),
  uploadCsv: (smeId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/smes/${smeId}/transactions/upload-csv`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const predictionsApi = {
  run: (smeId) => api.post(`/smes/${smeId}/predict`),
  list: (smeId) => api.get(`/smes/${smeId}/predictions`),
  scorecard: (smeId) => api.get(`/smes/${smeId}/scorecard`),
}

export const alertsApi = {
  list: (p) => api.get('/alerts/', { params: p }),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
  resolve: (id) => api.post(`/alerts/${id}/resolve`),
}

export const recommendationsApi = {
  list: (p) => api.get('/recommendations/', { params: p }),
  update: (id, d) => api.patch(`/recommendations/${id}`, d),
}

export const creditApi = {
  assess: (smeId) => api.post(`/credit/smes/${smeId}/assess`),
  list: (p) => api.get('/credit/', { params: p }),
}

export const sectorApi = {
  overview: () => api.get('/sector/overview'),
  riskBySector: () => api.get('/sector/risk-by-sector'),
  provinceMap: () => api.get('/sector/province-map'),
}

export const portfolioApi = {
  summary: () => api.get('/portfolio/summary'),
  watchlist: () => api.get('/portfolio/watchlist'),
  riskTrend: () => api.get('/portfolio/risk-trend'),
}

export const reportsApi = {
  generate: (type, smeId) => api.post('/reports/', null, { params: { report_type: type, sme_id: smeId } }),
  list: () => api.get('/reports/'),
  get: (id) => api.get(`/reports/${id}`),
}

export const usersApi = {
  list: () => api.get('/users/'),
  updateMe: (d) => api.patch('/users/me', d),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  activate: (id) => api.patch(`/users/${id}/activate`),
}

export const auditApi = {
  list: (p) => api.get('/audit/', { params: p }),
}

export const engagementsApi = {
  upsert: (sme_id, status, loan_amount, notes) =>
    api.post('/engagements/', { sme_id, status, loan_amount: loan_amount || null, notes: notes || null }),
  mine: () => api.get('/engagements/mine'),
  forSme: (sme_id) => api.get(`/engagements/sme/${sme_id}`),
  remove: (sme_id) => api.delete(`/engagements/sme/${sme_id}`),
  overview: () => api.get('/engagements/overview'),
}

export default api
