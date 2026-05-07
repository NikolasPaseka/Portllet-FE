const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5276"

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

async function getAuthHeader(): Promise<Record<string, string> | {}> {
  if (typeof window === "undefined") return {}

  const tokens = localStorage.getItem("auth_tokens")
  if (!tokens) return {}

  try {
    const { accessToken } = JSON.parse(tokens) as AuthTokens
    return { Authorization: `Bearer ${accessToken}` }
  } catch {
    return {}
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false

  const tokensStr = localStorage.getItem("auth_tokens")
  if (!tokensStr) return false

  try {
    const { refreshToken } = JSON.parse(tokensStr) as AuthTokens
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (res.ok) {
      const data = await res.json()
      localStorage.setItem("auth_tokens", JSON.stringify({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || refreshToken,
      }))
      return true
    }
  } catch {
    // ignore
  }

  // refresh failed - clear auth
  localStorage.removeItem("auth_tokens")
  localStorage.removeItem("auth_user")
  return false
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers, ...init } = options

  const authHeader = requiresAuth ? await getAuthHeader() : {}

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...headers,
    },
    ...init,
  })

  // handle 401 - try refresh once
  if (res.status === 401 && requiresAuth) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // retry with new token
      const newAuthHeader = await getAuthHeader()
      const retryRes = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...newAuthHeader,
          ...headers,
        },
        ...init,
      })

      if (retryRes.ok) {
        const rawData = await retryRes.json()
        const data = unwrapResponse(rawData) as T
        console.debug(`[API] ${endpoint} (retry):`, data)
        return data
      }
    }
    // redirect to login
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_tokens")
      localStorage.removeItem("auth_user")
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }

  const rawData = await res.json()
  const data = unwrapResponse(rawData) as T
  console.debug(`[API] ${endpoint}:`, data)
  return data
}

// Helper to unwrap API response if it's wrapped
function unwrapResponse(response: any): any {
  // If response has success/data/error structure, unwrap it
  if (response && typeof response === "object" && "success" in response && "data" in response) {
    return response.data
  }
  // Otherwise return as-is
  return response
}

// Auth API
export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiRequest<{ accessToken: string; refreshToken: string; user: User }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
        requiresAuth: false,
      }
    ),

  login: (email: string, password: string) =>
    apiRequest<{ accessToken: string; refreshToken: string; user: User }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
        requiresAuth: false,
      }
    ),

  logout: async (refreshToken: string) => {
    await apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_tokens")
      localStorage.removeItem("auth_user")
    }
  },

  me: () => apiRequest<User>("/auth/me"),
}

// Dashboard API
export const dashboardApi = {
  overview: () =>
    apiRequest<{
      cash_czk: number
      banks_czk: number
      stocks_czk: number
      crypto_czk: number
      other_czk: number
      total_czk: number
      fx_rate_usd_czk: number
    }>("/dashboard"),
}

// Cash API
export const cashApi = {
  get: () => apiRequest<{ id: string; amount: number; currency: string }>("/cash"),
  update: (amount: number, currency: string) =>
    apiRequest<{ id: string; amount: number; currency: string }>("/cash", {
      method: "PUT",
      body: JSON.stringify({ amount, currency }),
    }),
}

// Bank Accounts API
export const banksApi = {
  list: () => apiRequest<Array<{ id: string; name: string; createdAt: string; accounts: unknown[] }>>("/banks"),
  create: (name: string) =>
    apiRequest<{ id: string; name: string; createdAt: string; accounts: unknown[] }>("/banks", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  update: (id: string, name: string) =>
    apiRequest<{ id: string; name: string; createdAt: string; accounts: unknown[] }>(`/banks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/banks/${id}`, { method: "DELETE" }),
}

// Accounts API
export const accountsApi = {
  list: (bankId?: string) => {
    const url = bankId ? `/accounts?bankId=${bankId}` : "/accounts"
    return apiRequest<Array<{
      id: string
      bankId: string
      bankName: string
      name: string
      type: string
      balance: number
      currency: string
      interestRate: number | null
      createdAt: string
      updatedAt: string
      envelopes: unknown[]
    }>>(url)
  },
  create: (data: { bankId: string; name: string; type: string; balance: number; currency: string; interestRate?: number }) =>
    apiRequest<{
      id: string
      bankId: string
      bankName: string
      name: string
      type: string
      balance: number
      currency: string
      interestRate: number | null
      createdAt: string
      updatedAt: string
      envelopes: unknown[]
    }>("/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; balance?: number; currency?: string }) =>
    apiRequest<{
      id: string
      bankId: string
      bankName: string
      name: string
      type: string
      balance: number
      currency: string
      interestRate: number | null
      createdAt: string
      updatedAt: string
      envelopes: unknown[]
    }>(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest(`/accounts/${id}`, { method: "DELETE" }),
}

// Stocks API
export const stocksApi = {
  list: () => apiRequest<Array<{
    id: string
    name: string
    ticker: string
    shares: number
    source?: string
    livePriceUsd: number | null
    totalValueUsd: number | null
    createdAt: string
    updatedAt: string
  }>>("/stocks"),
  create: (data: { name: string; ticker: string; shares: number; source?: string }) =>
    apiRequest<{
      id: string
      name: string
      ticker: string
      shares: number
      source?: string
      livePriceUsd: number | null
      totalValueUsd: number | null
      createdAt: string
      updatedAt: string
    }>("/stocks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; ticker?: string; shares?: number; source?: string }) =>
    apiRequest<{
      id: string
      name: string
      ticker: string
      shares: number
      source?: string
      livePriceUsd: number | null
      totalValueUsd: number | null
      createdAt: string
      updatedAt: string
    }>(`/stocks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/stocks/${id}`, { method: "DELETE" }),
}

// Crypto API
export const cryptoApi = {
  list: () => apiRequest<Array<{
    id: string
    name: string
    symbol: string
    amount: number
    source?: string
    livePriceUsd: number | null
    totalValueUsd: number | null
    createdAt: string
    updatedAt: string
  }>>("/crypto"),
  create: (data: { name: string; symbol: string; amount: number; source?: string }) =>
    apiRequest<{
      id: string
      name: string
      symbol: string
      amount: number
      source?: string
      livePriceUsd: number | null
      totalValueUsd: number | null
      createdAt: string
      updatedAt: string
    }>("/crypto", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; amount?: number; source?: string }) =>
    apiRequest<{
      id: string
      name: string
      symbol: string
      amount: number
      source?: string
      livePriceUsd: number | null
      totalValueUsd: number | null
      createdAt: string
      updatedAt: string
    }>(`/crypto/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/crypto/${id}`, { method: "DELETE" }),
}

// Assets API (Others)
export const assetsApi = {
  list: () => apiRequest<Array<{
    id: string
    name: string
    value: number
    currency: string
    note?: string
    source?: string
    createdAt: string
  }>>("/assets"),
  create: (data: { name: string; value: number; currency: string; note?: string; source?: string }) =>
    apiRequest<{
      id: string
      name: string
      value: number
      currency: string
      note?: string
      source?: string
      createdAt: string
    }>("/assets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; value?: number; note?: string; source?: string }) =>
    apiRequest<{
      id: string
      name: string
      value: number
      currency: string
      note?: string
      source?: string
      createdAt: string
    }>(`/assets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/assets/${id}`, { method: "DELETE" }),
}

// Calendar API
export const calendarApi = {
  getStatus: () =>
    apiRequest<{ connected: boolean; email?: string }>("/auth/google/status"),

  connect: () =>
    apiRequest<{ url: string }>("/auth/google"),

  disconnect: () =>
    apiRequest<{ message: string }>("/auth/google", { method: "DELETE" }),

  getCalendars: () =>
    apiRequest<Array<{ id: string; name: string; color: string }>>("/calendar/calendars"),

  getEvents: (timeMin?: string, timeMax?: string) => {
    const params = new URLSearchParams()
    if (timeMin) params.set("timeMin", timeMin)
    if (timeMax) params.set("timeMax", timeMax)
    const url = params.toString() ? `/calendar/events?${params}` : "/calendar/events"
    return apiRequest<Array<{
      id: string
      title: string
      description?: string
      start: string
      end: string
      colorId?: string
      attendees?: { email: string; displayName?: string }[]
      isAllDay: boolean
      calendarId?: string
      calendarName?: string
      calendarColor?: string
    }>>(url)
  },

  createEvent: (data: {
    summary: string
    description?: string
    start: string
    end: string
    calendarId: string
    isAllDay: boolean
  }) =>
    apiRequest<{
      id: string
      title: string
      description?: string
      start: string
      end: string
      isAllDay: boolean
    }>("/calendar/events", { method: "POST", body: JSON.stringify(data) }),

  updateEvent: (data: {
    eventId: string
    summary?: string
    description?: string
    start?: string
    end?: string
    calendarId: string
    isAllDay: boolean
  }) =>
    apiRequest<{
      id: string
      title: string
      description?: string
      start: string
      end: string
      isAllDay: boolean
    }>("/calendar/events", { method: "PUT", body: JSON.stringify(data) }),

  deleteEvent: (eventId: string, calendarId: string) =>
    apiRequest<{ message: string }>("/calendar/events", {
      method: "DELETE",
      body: JSON.stringify({ eventId, calendarId }),
    }),
}

// Todo API
export const todoApi = {
  getSections: () =>
    apiRequest<Array<{
      id: string
      name: string
      color: string
      position: number
      tasks: Array<{
        id: string
        sectionId: string
        title: string
        description?: string
        dueDate?: string
        duration?: number
        repeat: string
        completed: boolean
        position: number
        subtasks: Array<{ id: string; title: string; completed: boolean; position: number }>
      }>
    }>>("/todos/sections"),

  createSection: (name: string, color?: string) =>
    apiRequest<{
      id: string
      name: string
      color: string
      position: number
      tasks: unknown[]
    }>("/todos/sections", {
      method: "POST",
      body: JSON.stringify({ name, color }),
    }),

  updateSection: (id: string, data: { name?: string; color?: string; position?: number }) =>
    apiRequest<{
      id: string
      name: string
      color: string
      position: number
    }>("/todos/sections", {
      method: "PUT",
      body: JSON.stringify({ id, ...data }),
    }),

  deleteSection: (id: string) =>
    apiRequest<{ message: string }>(`/todos/sections/${id}`, { method: "DELETE" }),

  createTask: (data: {
    sectionId: string
    title: string
    description?: string
    dueDate?: string
    duration?: number
    repeat?: string
    subtasks?: { title: string }[]
  }) =>
    apiRequest<{
      id: string
      sectionId: string
      title: string
      description?: string
      dueDate?: string
      duration?: number
      repeat: string
      completed: boolean
      position: number
      subtasks: Array<{ id: string; title: string; completed: boolean; position: number }>
    }>("/todos/tasks", { method: "POST", body: JSON.stringify(data) }),

  updateTask: (data: {
    id: string
    title?: string
    description?: string
    dueDate?: string | null
    duration?: number | null
    repeat?: string
    completed?: boolean
    sectionId?: string
    position?: number
    subtasks?: Array<{ id?: string; title: string; completed?: boolean }>
  }) =>
    apiRequest<{
      id: string
      sectionId: string
      title: string
      description?: string
      dueDate?: string
      duration?: number
      repeat: string
      completed: boolean
      position: number
      subtasks: Array<{ id: string; title: string; completed: boolean; position: number }>
    }>("/todos/tasks", { method: "PUT", body: JSON.stringify(data) }),

  deleteTask: (id: string) =>
    apiRequest<{ message: string }>(`/todos/tasks/${id}`, { method: "DELETE" }),

  reorderSections: (sectionIds: string[]) =>
    apiRequest<{ message: string }>("/todos/sections/reorder", {
      method: "PUT",
      body: JSON.stringify({ sectionIds }),
    }),

  reorderTasks: (taskUpdates: { taskId: string; sectionId: string; position: number }[]) =>
    apiRequest<{ message: string }>("/todos/tasks/reorder", {
      method: "PUT",
      body: JSON.stringify({ taskUpdates }),
    }),
}