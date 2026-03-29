(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
    "documentsApi",
    ()=>documentsApi,
    "stocksApi",
    ()=>stocksApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:5276") || "http://localhost:5276";
async function getAuthHeader() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const tokens = localStorage.getItem("auth_tokens");
    if (!tokens) return {};
    try {
        const { accessToken } = JSON.parse(tokens);
        return {
            Authorization: `Bearer ${accessToken}`
        };
    } catch  {
        return {};
    }
}
async function refreshAccessToken() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const tokensStr = localStorage.getItem("auth_tokens");
    if (!tokensStr) return false;
    try {
        const { refreshToken } = JSON.parse(tokensStr);
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                refreshToken
            })
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem("auth_tokens", JSON.stringify({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken || refreshToken
            }));
            return true;
        }
    } catch  {
    // ignore
    }
    // refresh failed - clear auth
    localStorage.removeItem("auth_tokens");
    localStorage.removeItem("auth_user");
    return false;
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
                return retryRes.json();
            }
        }
        // redirect to login
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.removeItem("auth_tokens");
            localStorage.removeItem("auth_user");
            window.location.href = "/login";
        }
        throw new Error("Unauthorized");
    }
    if (!res.ok) {
        const error = await res.json().catch(()=>({
                message: "Request failed"
            }));
        throw new Error(error.message || `HTTP ${res.status}`);
    }
    return res.json();
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
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.removeItem("auth_tokens");
            localStorage.removeItem("auth_user");
        }
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
const documentsApi = {
    list: (type)=>{
        const url = type ? `/documents?type=${type}` : "/documents";
        return apiRequest(url);
    },
    getUploadUrl: (fileName, contentType)=>apiRequest("/documents/upload-url", {
            method: "POST",
            body: JSON.stringify({
                fileName,
                contentType
            })
        }),
    create: (data)=>apiRequest("/documents", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    update: (id, data)=>apiRequest(`/documents/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    delete: (id)=>apiRequest(`/documents/${id}`, {
            method: "DELETE"
        }),
    addTag: (id, tagName)=>apiRequest(`/documents/${id}/tags`, {
            method: "POST",
            body: JSON.stringify({
                tagName
            })
        }),
    removeTag: (id, tagName)=>apiRequest(`/documents/${id}/tags/${tagName}`, {
            method: "DELETE"
        })
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/contexts/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            // Check for existing session
            const tokensStr = localStorage.getItem("auth_tokens");
            const userStr = localStorage.getItem("auth_user");
            if (tokensStr && userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch  {
                    // invalid stored data
                    localStorage.removeItem("auth_tokens");
                    localStorage.removeItem("auth_user");
                }
            }
            setLoading(false);
        }
    }["AuthProvider.useEffect"], []);
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[login]": async (email, password)=>{
            const data = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].login(email, password);
            localStorage.setItem("auth_tokens", JSON.stringify({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            }));
            localStorage.setItem("auth_user", JSON.stringify(data.user));
            setUser(data.user);
        }
    }["AuthProvider.useCallback[login]"], []);
    const register = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[register]": async (email, password, name)=>{
            const data = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].register(email, password, name);
            localStorage.setItem("auth_tokens", JSON.stringify({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken
            }));
            localStorage.setItem("auth_user", JSON.stringify(data.user));
            setUser(data.user);
        }
    }["AuthProvider.useCallback[register]"], []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[logout]": async ()=>{
            const tokensStr = localStorage.getItem("auth_tokens");
            if (tokensStr) {
                try {
                    const { refreshToken } = JSON.parse(tokensStr);
                    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].logout(refreshToken);
                } catch  {
                // ignore logout errors
                }
            }
            localStorage.removeItem("auth_tokens");
            localStorage.removeItem("auth_user");
            setUser(null);
        }
    }["AuthProvider.useCallback[logout]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
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
        lineNumber: 81,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "l6zUyVi7WcY8h9thikngMHGXU8Y=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_35d54c85._.js.map