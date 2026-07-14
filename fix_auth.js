const fs = require('fs');
const path = require('path');

const filePaths = [
  'apps/admin/app/api/auth/login/route.ts',
  'apps/staff/app/api/auth/login/route.ts',
  'apps/web/app/api/auth/login/route.ts',
  
  'apps/admin/app/api/auth/logout/route.ts',
  'apps/staff/app/api/auth/logout/route.ts',
  'apps/web/app/api/auth/logout/route.ts',
  
  'apps/admin/app/api/auth/session/route.ts',
  'apps/web/app/api/auth/session/route.ts',

  'apps/admin/middleware.ts',
  'apps/staff/middleware.ts',
  'apps/web/middleware.ts',
  
  'apps/admin/app/api/proxy/[...path]/route.ts',
  'apps/staff/app/api/proxy/[...path]/route.ts'
];

for (const fp of filePaths) {
  const fullPath = path.join(__dirname, fp);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Fix Login/Logout/Session routes
  if (fp.includes('auth/login') || fp.includes('auth/logout') || fp.includes('auth/session')) {
    const appName = fp.split('/')[1]; // admin, staff, web
    const oldCookieConst = `const COOKIE_NAME = "__Secure-mg_${appName}_session";`;
    if (content.includes(oldCookieConst)) {
      content = content.replace(oldCookieConst, "");
      
      content = content.replace(/export async function (POST|GET)\(req: NextRequest\) \{/, 
`export async function $1(req: NextRequest) {
  const isSecure = req.nextUrl.protocol === "https:";
  const COOKIE_NAME = isSecure ? "__Secure-mg_${appName}_session" : "mg_${appName}_session";`
      );
      
      content = content.replace(/secure: true,/g, 'secure: isSecure,');
      content = content.replace(/secure: process\.env\.NODE_ENV === "production",/g, 'secure: isSecure,');
    }
  }

  // Fix Proxy routes
  if (fp.includes('proxy')) {
    const appName = fp.split('/')[1]; // admin, staff
    const oldCookieConst = `const COOKIE_NAME = "__Secure-mg_${appName}_session";`;
    if (content.includes(oldCookieConst)) {
      content = content.replace(oldCookieConst, "");
      
      content = content.replace(/async function handleProxy\(req: NextRequest, props: \{ params: Promise<\{ path: string\[\] \}> \}\) \{/, 
`async function handleProxy(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const isSecure = req.nextUrl.protocol === "https:";
  const COOKIE_NAME = isSecure ? "__Secure-mg_${appName}_session" : "mg_${appName}_session";`
      );
    }
  }

  // Fix Middleware
  if (fp.endsWith('middleware.ts')) {
    const appName = fp.split('/')[1]; // admin, staff, web
    const oldCookieLine1 = `const cookieName = process.env.NODE_ENV === "production"`;
    const oldCookieLine2 = `const cookieName = "__Secure-mg_${appName}_session";`;
    
    if (content.includes(oldCookieLine2)) {
      content = content.replace(oldCookieLine2, 
`const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure ? "__Secure-mg_${appName}_session" : "mg_${appName}_session";`);
    } else if (content.includes(oldCookieLine1)) {
      // It might have been left over if we didn't revert it properly, but we reverted to HEAD~1
    }
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${fp}`);
}
