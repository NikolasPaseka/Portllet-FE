module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "accountsApi",
    ()=>accountsApi,
    "apiRequest",
    ()=>apiRequest,
    "assetsApi",
    ()=>assetsApi,
    "authApi",
    ()=>authApi,
    "banksApi",
    ()=>banksApi,
    "cashApi",
    ()=>cashApi,
    "cryptoApi",
    ()=>cryptoApi,
    "dashboardApi",
    ()=>dashboardApi,
    "stocksApi",
    ()=>stocksApi
]);
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:5276") || "http://localhost:5276";
async function getAuthHeader() {
    if ("TURBOPACK compile-time truthy", 1) return {};
    //TURBOPACK unreachable
    ;
    const tokens = undefined;
}
async function refreshAccessToken() {
    if ("TURBOPACK compile-time truthy", 1) return false;
    //TURBOPACK unreachable
    ;
    const tokensStr = undefined;
}
async function apiRequest(endpoint, options = {}) {
    const { requiresAuth = true, headers, ...init } = options;
    const authHeader = requiresAuth ? await getAuthHeader() : {};
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...authHeader,
            ...headers
        },
        ...init
    });
    // handle 401 - try refresh once
    if (res.status === 401 && requiresAuth) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // retry with new token
            const newAuthHeader = await getAuthHeader();
            const retryRes = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    "Content-Type": "application/json",
                    ...newAuthHeader,
                    ...headers
                },
                ...init
            });
            if (retryRes.ok) {
                const rawData = await retryRes.json();
                const data = unwrapResponse(rawData);
                console.debug(`[API] ${endpoint} (retry):`, data);
                return data;
            }
        }
        // redirect to login
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        throw new Error("Unauthorized");
    }
    if (!res.ok) {
        const error = await res.json().catch(()=>({
                message: "Request failed"
            }));
        throw new Error(error.message || `HTTP ${res.status}`);
    }
    const rawData = await res.json();
    const data = unwrapResponse(rawData);
    console.debug(`[API] ${endpoint}:`, data);
    return data;
}
// Helper to unwrap API response if it's wrapped
function unwrapResponse(response) {
    // If response has success/data/error structure, unwrap it
    if (response && typeof response === "object" && "success" in response && "data" in response) {
        return response.data;
    }
    // Otherwise return as-is
    return response;
}
const authApi = {
    register: (email, password, name)=>apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                email,
                password,
                name
            }),
            requiresAuth: false
        }),
    login: (email, password)=>apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            }),
            requiresAuth: false
        }),
    logout: async (refreshToken)=>{
        await apiRequest("/auth/logout", {
            method: "POST",
            body: JSON.stringify({
                refreshToken
            })
        });
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    },
    me: ()=>apiRequest("/auth/me")
};
const dashboardApi = {
    overview: ()=>apiRequest("/dashboard")
};
const cashApi = {
    get: ()=>apiRequest("/cash"),
    update: (amount, currency)=>apiRequest("/cash", {
            method: "PUT",
            body: JSON.stringify({
                amount,
                currency
            })
        })
};
const banksApi = {
    list: ()=>apiRequest("/banks"),
    create: (name)=>apiRequest("/banks", {
            method: "POST",
            body: JSON.stringify({
                name
            })
        }),
    update: (id, name)=>apiRequest(`/banks/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                name
            })
        }),
    delete: (id)=>apiRequest(`/banks/${id}`, {
            method: "DELETE"
        })
};
const accountsApi = {
    list: (bankId)=>{
        const url = bankId ? `/accounts?bankId=${bankId}` : "/accounts";
        return apiRequest(url);
    },
    create: (data)=>apiRequest("/accounts", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/accounts/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/accounts/${id}`, {
            method: "DELETE"
        })
};
const stocksApi = {
    list: ()=>apiRequest("/stocks"),
    create: (data)=>apiRequest("/stocks", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/stocks/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/stocks/${id}`, {
            method: "DELETE"
        })
};
const cryptoApi = {
    list: ()=>apiRequest("/crypto"),
    create: (data)=>apiRequest("/crypto", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/crypto/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/crypto/${id}`, {
            method: "DELETE"
        })
};
const assetsApi = {
    list: ()=>apiRequest("/assets"),
    create: (data)=>apiRequest("/assets", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/assets/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/assets/${id}`, {
            method: "DELETE"
        })
};
}),
"[project]/contexts/auth-context.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
// Helper to safely extract auth tokens from response
function extractAuthTokens(response) {
    if (!response) {
        throw new Error("Empty response from server");
    }
    // Handle direct response format
    if (response.accessToken && response.refreshToken && response.user) {
        return {
            accessToken: String(response.accessToken).trim(),
            refreshToken: String(response.refreshToken).trim(),
            user: response.user
        };
    }
    // Handle wrapped response format (if data is nested)
    if (response.data && response.data.accessToken) {
        return {
            accessToken: String(response.data.accessToken).trim(),
            refreshToken: String(response.data.refreshToken).trim(),
            user: response.data.user
        };
    }
    // Detailed error reporting
    const missing = [];
    if (!response.accessToken && !response.data?.accessToken) missing.push("accessToken");
    if (!response.refreshToken && !response.data?.refreshToken) missing.push("refreshToken");
    if (!response.user && !response.data?.user) missing.push("user");
    throw new Error(`Invalid authentication response: missing fields [${missing.join(", ")}]`);
}
function AuthProvider({ children }) {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Initialize auth from localStorage
        try {
            const tokensStr = localStorage.getItem("auth_tokens");
            const userStr = localStorage.getItem("auth_user");
            if (tokensStr && userStr) {
                const tokens = JSON.parse(tokensStr);
                const userData = JSON.parse(userStr);
                // Validate tokens exist and have required fields
                if (tokens.accessToken && tokens.refreshToken && userData.id) {
                    setUser(userData);
                } else {
                    // Invalid token structure, clear
                    localStorage.removeItem("auth_tokens");
                    localStorage.removeItem("auth_user");
                }
            }
        } catch (error) {
            console.error("Failed to initialize auth:", error);
            localStorage.removeItem("auth_tokens");
            localStorage.removeItem("auth_user");
        } finally{
            setLoading(false);
        }
    }, []);
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (email, password)=>{
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authApi"].login(email, password);
            const authTokens = extractAuthTokens(response);
            // Validate final tokens
            if (!authTokens.user.id) {
                throw new Error("User ID is missing from authentication response");
            }
            localStorage.setItem("auth_tokens", JSON.stringify({
                accessToken: authTokens.accessToken,
                refreshToken: authTokens.refreshToken
            }));
            localStorage.setItem("auth_user", JSON.stringify(authTokens.user));
            setUser(authTokens.user);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Login failed";
            console.error("Login error:", message, error);
            throw new Error(message);
        }
    }, []);
    const register = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (email, password, name)=>{
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authApi"].register(email, password, name);
            const authTokens = extractAuthTokens(response);
            // Validate final tokens
            if (!authTokens.user.id) {
                throw new Error("User ID is missing from authentication response");
            }
            localStorage.setItem("auth_tokens", JSON.stringify({
                accessToken: authTokens.accessToken,
                refreshToken: authTokens.refreshToken
            }));
            localStorage.setItem("auth_user", JSON.stringify(authTokens.user));
            setUser(authTokens.user);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Registration failed";
            console.error("Register error:", message, error);
            throw new Error(message);
        }
    }, []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const tokensStr = localStorage.getItem("auth_tokens");
        if (tokensStr) {
            try {
                const { refreshToken } = JSON.parse(tokensStr);
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authApi"].logout(refreshToken);
            } catch  {
            // ignore logout errors
            }
        }
        localStorage.removeItem("auth_tokens");
        localStorage.removeItem("auth_user");
        setUser(null);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            login,
            register,
            logout,
            isAuthenticated: !!user
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/auth-context.tsx",
        lineNumber: 157,
        columnNumber: 5
    }, this);
}
function useAuth() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__66c7b853._.js.map