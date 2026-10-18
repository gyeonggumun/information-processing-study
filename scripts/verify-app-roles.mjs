import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'rolldown';
import { APP_ROLES, normalizeAppRole, hasRequiredRole } from '../src/lib/appRoles.js';

for (const [role, allowed] of [['user', [true, false, false]], ['pro', [true, true, false]], ['admin', [true, true, true]]]) {
  APP_ROLES.forEach((required, index) => assert.equal(hasRequiredRole(role, required), allowed[index]));
  assert.equal(normalizeAppRole(role), role);
}
for (const invalid of [null, undefined, '', 'ADMIN', 'owner', {}, ['admin'], '__proto__']) {
  assert.equal(normalizeAppRole(invalid), 'user');
  assert.equal(hasRequiredRole(invalid, 'pro'), false);
  assert.equal(hasRequiredRole('admin', invalid || 'unknown'), false);
}
assert.equal(hasRequiredRole('user'), true);
const app = readFileSync('src/App.jsx', 'utf8');
assert.match(app, /path="\/exam-summary" element=\{<ProtectedRoute requiredRole="pro">/);
assert.match(app, /path="\/admin" element=\{<ProtectedRoute requiredRole="admin">/);
assert.match(readFileSync('src/components/Layout.jsx', 'utf8'), /hasRequiredRole\(appRole, 'pro'\)/);
const authSource = readFileSync('src/contexts/AuthContext.jsx', 'utf8');
assert.match(authSource, /let role = 'user'/);
assert.match(authSource, /if \(!error\) role = normalizeAppRole\(data\)/);
assert.match(authSource, /const appRole = isRoleReady \? verifiedRole\.role : 'user'/);

// Render the real route guard with a minimal Auth fixture, not a reimplementation.
mkdirSync('tmp/roles', { recursive: true });
const output = resolve('tmp/roles/guard-check.mjs');
const pathLiteral = path => JSON.stringify(resolve(path).replaceAll('\\', '/'));
await build({
  input: 'role-check-entry', platform: 'node', external: ['react', 'react-dom/server', 'react-router-dom'],
  plugins: [{ name: 'role-check-fixture',
    resolveId(id) {
      if (id === 'role-check-entry') return '\0role-check-entry';
      if (id === '../contexts/AuthContext') return '\0auth-fixture';
    },
    load(id) {
      if (id === '\0auth-fixture') return 'export let fixture = {}; export const setAuth = value => { fixture = value; }; export const useAuth = () => fixture; export const getSafeReturnPath = path => path;';
      if (id === '\0role-check-entry') return `
        import React from 'react';
        import { renderToString } from 'react-dom/server';
        import { MemoryRouter } from 'react-router-dom';
        import ProtectedRoute from ${pathLiteral('src/components/ProtectedRoute.jsx')};
        import { setAuth } from '../contexts/AuthContext';
        export function renderGuard(auth, requiredRole) {
          setAuth(auth);
          return renderToString(React.createElement(MemoryRouter, null,
            React.createElement(ProtectedRoute, { requiredRole }, React.createElement('p', null, 'protected-content'))));
        }
      `;
    },
  }], output: { file: output, format: 'esm' },
});
const { renderGuard } = await import(pathToFileURL(output).href);
for (const role of APP_ROLES) {
  const auth = { isLoading: false, isLoggedIn: true, hasNickname: true, appRole: role };
  for (const required of ['pro', 'admin']) assert.equal(renderGuard(auth, required).includes('protected-content'), hasRequiredRole(role, required));
  assert.equal(renderGuard({ ...auth, isLoggedIn: false }, 'pro').includes('protected-content'), false);
  assert.equal(renderGuard({ ...auth, hasNickname: false }, 'pro').includes('protected-content'), false);
  assert.equal(renderGuard({ ...auth, isLoading: true }, 'pro').includes('protected-content'), false);
}
console.log('PASS: User/Pro/Admin hierarchy, invalid roles, route configuration and actual ProtectedRoute rendering');
