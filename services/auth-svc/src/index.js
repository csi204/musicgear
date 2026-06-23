import { Hono } from "hono";
import { createAuthMiddleware } from "@musicgear/auth-middleware";

const app = new Hono();
const authMiddleware = createAuthMiddleware("musicgear.kinde.com");

const STATE_TTL_MS = 10 * 60 * 1000;
const usedNonces = new Map();

function normalizeKindeDomain(kindeDomain) {
	return kindeDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function parseAllowedOrigins(env) {
	const raw = env.ALLOWED_REDIRECT_ORIGINS || "";
	return raw
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
}

function isAllowedRedirectUri(uri, allowedOrigins) {
	try {
		const origin = new URL(uri).origin;
		return allowedOrigins.some((allowed) => {
			try {
				return new URL(allowed).origin === origin;
			} catch {
				return allowed === origin;
			}
		});
	} catch {
		return false;
	}
}

function bufferToBase64Url(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/");
	const padLength = (4 - (padded.length % 4)) % 4;
	const base64 = `${padded}${"=".repeat(padLength)}`;
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
}

async function getHmacKey(secret) {
	const encoder = new TextEncoder();
	return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
		"sign",
		"verify",
	]);
}

async function signState(payload, secret) {
	const key = await getHmacKey(secret);
	const encoder = new TextEncoder();
	const payloadPart = bufferToBase64Url(encoder.encode(JSON.stringify(payload)));
	const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadPart));
	return `${payloadPart}.${bufferToBase64Url(signature)}`;
}

async function verifyState(state, secret) {
	const [payloadPart, signaturePart] = state.split(".");
	if (!payloadPart || !signaturePart) {
		return null;
	}

	const key = await getHmacKey(secret);
	const encoder = new TextEncoder();
	const valid = await crypto.subtle.verify(
		"HMAC",
		key,
		base64UrlToBytes(signaturePart),
		encoder.encode(payloadPart),
	);

	if (!valid) {
		return null;
	}

	const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart)));
	if (!payload?.exp || Date.now() > payload.exp) {
		return null;
	}

	if (payload.nonce && usedNonces.has(payload.nonce)) {
		return null;
	}

	if (payload.nonce) {
		usedNonces.set(payload.nonce, Date.now());
		for (const [nonce, createdAt] of usedNonces.entries()) {
			if (Date.now() - createdAt > STATE_TTL_MS) {
				usedNonces.delete(nonce);
			}
		}
	}

	return payload;
}

function buildKindeUrl(c, path, params = {}) {
	const domain = normalizeKindeDomain(c.env.KINDE_DOMAIN || "musicgear.kinde.com");
	const url = new URL(`https://${domain}${path}`);

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			url.searchParams.set(key, String(value));
		}
	});

	return url.toString();
}

function getAuthCallbackUri(c) {
	return (
		c.env.AUTH_CALLBACK_URI ||
		c.env.KINDE_REDIRECT_URI ||
		"http://127.0.0.1:8788/auth/callback"
	);
}

function getRequestRedirectUri(c, fallbackPath = "/auth/callback") {
	const requestRedirect = new URL(c.req.url).searchParams.get("redirect_uri");
	if (requestRedirect) {
		return requestRedirect;
	}

	const configuredRedirect = c.env.KINDE_REDIRECT_URI;
	if (configuredRedirect) {
		return configuredRedirect;
	}

	return `${c.env.PORTAL_WEB_URL || "http://127.0.0.1:8800"}${fallbackPath}`;
}

function resolveValidatedRedirectUri(c) {
	const allowedOrigins = parseAllowedOrigins(c.env);
	const redirectUri = getRequestRedirectUri(c);

	if (!isAllowedRedirectUri(redirectUri, allowedOrigins)) {
		return {
			ok: false,
			response: c.json(
				{ error: { code: "INVALID_REDIRECT", message: "redirect_uri is not allowed" } },
				400,
			),
		};
	}

	return { ok: true, redirectUri };
}

function resolvePortalByRole(c, role) {
	const portals = {
		customer: c.env.PORTAL_WEB_URL || "http://127.0.0.1:8800",
		admin: c.env.PORTAL_ADMIN_URL || "http://127.0.0.1:8798",
		staff: c.env.PORTAL_STAFF_URL || "http://127.0.0.1:8799",
	};

	return portals[role] || portals.customer;
}

function decodeJwtPayload(token) {
	const parts = token.split(".");
	if (parts.length !== 3) {
		return null;
	}

	try {
		const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const padLength = (4 - (payload.length % 4)) % 4;
		const json = atob(`${payload}${"=".repeat(padLength)}`);
		return JSON.parse(json);
	} catch {
		return null;
	}
}

function extractRoleFromTokenResponse(tokenResponse) {
	const idTokenClaims = tokenResponse.id_token ? decodeJwtPayload(tokenResponse.id_token) : null;
	const accessTokenClaims = tokenResponse.access_token ? decodeJwtPayload(tokenResponse.access_token) : null;

	// Kinde stores roles as an array of objects: [{id, key, name}]
	// Check access_token first, then id_token
	const kindeRoles =
		(Array.isArray(accessTokenClaims?.roles) && accessTokenClaims.roles.length > 0
			? accessTokenClaims.roles
			: null) ||
		(Array.isArray(idTokenClaims?.roles) && idTokenClaims.roles.length > 0
			? idTokenClaims.roles
			: null) ||
		[];

	// Extract first role key (e.g. "admin", "staff")
	const roleKey = kindeRoles[0]?.key ?? null;

	// Fallback: also support legacy flat "role" string claim
	const flatRole = idTokenClaims?.role || accessTokenClaims?.role || null;

	const raw = roleKey || flatRole || "customer";
	const normalized = String(raw).toLowerCase();
	return ["customer", "staff", "admin"].includes(normalized) ? normalized : "customer";
}

function buildPortalCallbackUrl(c, role, tokenResponse, errorMessage) {
	const portalBase = resolvePortalByRole(c, role);
	const callbackUrl = new URL("/auth/callback", portalBase);

	if (errorMessage) {
		// Errors use query params (not sensitive)
		callbackUrl.searchParams.set("error", errorMessage);
		return callbackUrl.toString();
	}

	// Tokens use hash fragment (#) — fragments are NEVER sent to the server
	// so they won't appear in server logs or Cloudflare request logging
	const fragment = new URLSearchParams();
	if (tokenResponse.access_token) {
		fragment.set("access_token", tokenResponse.access_token);
	}
	if (tokenResponse.refresh_token) {
		fragment.set("refresh_token", tokenResponse.refresh_token);
	}
	if (tokenResponse.expires_in !== undefined) {
		fragment.set("expires_in", String(tokenResponse.expires_in));
	}
	if (tokenResponse.token_type) {
		fragment.set("token_type", tokenResponse.token_type);
	}

	callbackUrl.hash = fragment.toString();
	return callbackUrl.toString();
}

async function createOAuthState(c, redirectUri) {
	if (!c.env.KINDE_CLIENT_SECRET) {
		throw new Error("KINDE_CLIENT_SECRET is not configured");
	}

	return signState(
		{
			nonce: crypto.randomUUID(),
			redirectUri,
			exp: Date.now() + STATE_TTL_MS,
		},
		c.env.KINDE_CLIENT_SECRET,
	);
}

async function exchangeAuthorizationCode(c, code) {
	const domain = normalizeKindeDomain(c.env.KINDE_DOMAIN || "musicgear.kinde.com");
	const callbackUri = getAuthCallbackUri(c);
	const body = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		client_id: c.env.KINDE_CLIENT_ID,
		client_secret: c.env.KINDE_CLIENT_SECRET,
		redirect_uri: callbackUri,
	});

	const response = await fetch(`https://${domain}/oauth2/token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(payload.error_description || payload.error || "Token exchange failed");
	}

	return payload;
}

app.get("/health", (c) => c.json({ status: "ok", service: "auth-svc" }));

app.get("/auth/login", async (c) => {
	const redirectResult = resolveValidatedRedirectUri(c);
	if (!redirectResult.ok) {
		return redirectResult.response;
	}

	try {
		const state = await createOAuthState(c, redirectResult.redirectUri);
		return c.redirect(
			buildKindeUrl(c, "/oauth2/auth", {
				client_id: c.env.KINDE_CLIENT_ID,
				redirect_uri: getAuthCallbackUri(c),
				response_type: "code",
				scope: "openid profile email offline",
				state,
			}),
		);
	} catch (error) {
		return c.json(
			{ error: { code: "AUTH_CONFIG_ERROR", message: error.message || "Auth is not configured" } },
			500,
		);
	}
});

app.get("/auth/register", async (c) => {
	const redirectResult = resolveValidatedRedirectUri(c);
	if (!redirectResult.ok) {
		return redirectResult.response;
	}

	try {
		const state = await createOAuthState(c, redirectResult.redirectUri);
		return c.redirect(
			buildKindeUrl(c, "/oauth2/auth", {
				client_id: c.env.KINDE_CLIENT_ID,
				redirect_uri: getAuthCallbackUri(c),
				response_type: "code",
				scope: "openid profile email offline",
				screen_hint: "signup",
				state,
			}),
		);
	} catch (error) {
		return c.json(
			{ error: { code: "AUTH_CONFIG_ERROR", message: error.message || "Auth is not configured" } },
			500,
		);
	}
});

app.get("/auth/callback", async (c) => {
	const currentUrl = new URL(c.req.url);
	const oauthError = currentUrl.searchParams.get("error");
	const oauthErrorDescription = currentUrl.searchParams.get("error_description");
	const code = currentUrl.searchParams.get("code");
	const state = currentUrl.searchParams.get("state");

	let fallbackRole = "customer";
	let fallbackPortal = resolvePortalByRole(c, fallbackRole);

	// Verify state once and reuse — calling verifyState twice would fail because
	// the first call marks the nonce as used, causing the second call to return null.
	const statePayload = (state && c.env.KINDE_CLIENT_SECRET)
		? await verifyState(state, c.env.KINDE_CLIENT_SECRET)
		: null;

	if (statePayload?.redirectUri && isAllowedRedirectUri(statePayload.redirectUri, parseAllowedOrigins(c.env))) {
		try {
			const origin = new URL(statePayload.redirectUri).origin;
			if (origin === (c.env.PORTAL_ADMIN_URL || "http://127.0.0.1:8798")) {
				fallbackRole = "admin";
			} else if (origin === (c.env.PORTAL_STAFF_URL || "http://127.0.0.1:8799")) {
				fallbackRole = "staff";
			}
			fallbackPortal = origin;
		} catch {
			// keep defaults
		}
	}

	if (oauthError) {
		const callbackUrl = new URL("/auth/callback", fallbackPortal);
		callbackUrl.searchParams.set("error", oauthErrorDescription || oauthError);
		return c.redirect(callbackUrl.toString());
	}

	if (!code || !state) {
		const callbackUrl = new URL("/auth/callback", fallbackPortal);
		callbackUrl.searchParams.set("error", "Missing authorization code or state");
		return c.redirect(callbackUrl.toString());
	}

	if (!c.env.KINDE_CLIENT_SECRET) {
		const callbackUrl = new URL("/auth/callback", fallbackPortal);
		callbackUrl.searchParams.set("error", "Auth service is not configured");
		return c.redirect(callbackUrl.toString());
	}

	if (!statePayload?.redirectUri) {
		const callbackUrl = new URL("/auth/callback", fallbackPortal);
		callbackUrl.searchParams.set("error", "Invalid or expired OAuth state");
		return c.redirect(callbackUrl.toString());
	}

	try {
		const tokenResponse = await exchangeAuthorizationCode(c, code);
		const role = extractRoleFromTokenResponse(tokenResponse);
		return c.redirect(buildPortalCallbackUrl(c, role, tokenResponse));
	} catch (error) {
		let role = fallbackRole;
		try {
			const origin = new URL(statePayload.redirectUri).origin;
			if (origin === (c.env.PORTAL_ADMIN_URL || "http://127.0.0.1:8798")) {
				role = "admin";
			} else if (origin === (c.env.PORTAL_STAFF_URL || "http://127.0.0.1:8799")) {
				role = "staff";
			}
		} catch {
			// keep fallback role
		}

		return c.redirect(buildPortalCallbackUrl(c, role, null, error.message || "Token exchange failed"));
	}
});

app.get("/auth/logout", (c) => {
	const redirectResult = resolveValidatedRedirectUri(c);
	if (!redirectResult.ok) {
		return redirectResult.response;
	}

	// Kinde's /logout endpoint uses 'redirect' param (not post_logout_redirect_uri)
	return c.redirect(
		buildKindeUrl(c, "/logout", {
			client_id: c.env.KINDE_CLIENT_ID,
			redirect: redirectResult.redirectUri,
		}),
	);
});

app.get("/auth/portal", async (c) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader) {
		return c.json({ error: "Missing authorization header" }, 401);
	}

	try {
		const response = await fetch(buildKindeUrl(c, "/account_api/v1/portal_link"), {
			headers: { Authorization: authHeader },
		});
		
		if (!response.ok) {
			const text = await response.text();
			console.error("[auth-svc] Portal link error:", text);
			return c.json({ error: "Failed to fetch portal link" }, response.status);
		}
		
		const data = await response.json();
		return c.json(data);
	} catch (error) {
		console.error("[auth-svc] Portal error:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

app.get("/auth/me", authMiddleware, (c) => {
	const user = c.get("user");
	return c.json({ status: "ok", user });
});

export default app;
