"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { authApi } from "@/lib/api"

interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Helper to safely extract auth tokens from response
function extractAuthTokens(response: any): AuthTokens {
  if (!response) {
    throw new Error("Empty response from server")
  }

  // Handle direct response format
  if (response.accessToken && response.refreshToken && response.user) {
    return {
      accessToken: String(response.accessToken).trim(),
      refreshToken: String(response.refreshToken).trim(),
      user: response.user as User,
    }
  }

  // Handle wrapped response format (if data is nested)
  if (response.data && response.data.accessToken) {
    return {
      accessToken: String(response.data.accessToken).trim(),
      refreshToken: String(response.data.refreshToken).trim(),
      user: response.data.user as User,
    }
  }

  // Detailed error reporting
  const missing = []
  if (!response.accessToken && !response.data?.accessToken) missing.push("accessToken")
  if (!response.refreshToken && !response.data?.refreshToken) missing.push("refreshToken")
  if (!response.user && !response.data?.user) missing.push("user")
  
  throw new Error(`Invalid authentication response: missing fields [${missing.join(", ")}]`)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize auth from localStorage
    try {
      const tokensStr = localStorage.getItem("auth_tokens")
      const userStr = localStorage.getItem("auth_user")

      if (tokensStr && userStr) {
        const tokens = JSON.parse(tokensStr)
        const userData = JSON.parse(userStr)
        
        // Validate tokens exist and have required fields
        if (tokens.accessToken && tokens.refreshToken && userData.id) {
          setUser(userData)
        } else {
          // Invalid token structure, clear
          localStorage.removeItem("auth_tokens")
          localStorage.removeItem("auth_user")
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error)
      localStorage.removeItem("auth_tokens")
      localStorage.removeItem("auth_user")
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      const authTokens = extractAuthTokens(response)
      
      // Validate final tokens
      if (!authTokens.user.id) {
        throw new Error("User ID is missing from authentication response")
      }

      localStorage.setItem("auth_tokens", JSON.stringify({
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
      }))
      localStorage.setItem("auth_user", JSON.stringify(authTokens.user))
      setUser(authTokens.user)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
      console.error("Login error:", message, error)
      throw new Error(message)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const response = await authApi.register(email, password, name)
      const authTokens = extractAuthTokens(response)
      
      // Validate final tokens
      if (!authTokens.user.id) {
        throw new Error("User ID is missing from authentication response")
      }

      localStorage.setItem("auth_tokens", JSON.stringify({
        accessToken: authTokens.accessToken,
        refreshToken: authTokens.refreshToken,
      }))
      localStorage.setItem("auth_user", JSON.stringify(authTokens.user))
      setUser(authTokens.user)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed"
      console.error("Register error:", message, error)
      throw new Error(message)
    }
  }, [])

  const logout = useCallback(async () => {
    const tokensStr = localStorage.getItem("auth_tokens")
    if (tokensStr) {
      try {
        const { refreshToken } = JSON.parse(tokensStr)
        await authApi.logout(refreshToken)
      } catch {
        // ignore logout errors
      }
    }
    localStorage.removeItem("auth_tokens")
    localStorage.removeItem("auth_user")
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}