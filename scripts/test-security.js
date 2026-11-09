(async () => {
  const BASE = 'http://localhost:3005';
  console.log('--- 1. Testing Security Headers & Health ---');
  const resHealth = await fetch(BASE + '/api/health');
  console.log('Health status code:', resHealth.status);
  const healthJson = await resHealth.json();
  console.log('Health body:', healthJson);
  console.log('Internal DB name hidden in health:', healthJson.data === undefined && healthJson.base === undefined);
  console.log('X-Frame-Options:', resHealth.headers.get('x-frame-options'));
  console.log('X-Content-Type-Options:', resHealth.headers.get('x-content-type-options'));
  console.log('X-Powered-By absent:', resHealth.headers.get('x-powered-by') === null);

  console.log('\n--- 2. Testing Authentication & Backdoor Removal ---');
  // Backdoor test
  const resBackdoor = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@toubagaz.sn', password: 'admin123' })
  });
  console.log('Backdoor admin123 login status (should be 401):', resBackdoor.status);

  // Valid admin login
  const resAdminLogin = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@toubagaz.sn', password: '12345678' })
  });
  console.log('Legitimate 12345678 login status (should be 200):', resAdminLogin.status);
  const adminSetCookie = resAdminLogin.headers.get('set-cookie');
  console.log('Admin session cookie set:', adminSetCookie ? adminSetCookie.includes('touba_gaz_session') : false);
  console.log('Admin cookie is HttpOnly:', adminSetCookie ? adminSetCookie.includes('httponly') || adminSetCookie.includes('HttpOnly') : false);
  const adminCookie = adminSetCookie ? adminSetCookie.split(';')[0] : '';

  // Valid employee login
  const resEmpLogin = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'abisene@toubagaz.sn', password: 'ToubaGaz@2026' })
  });
  console.log('Employee login status (should be 200):', resEmpLogin.status);
  const empSetCookie = resEmpLogin.headers.get('set-cookie');
  const empCookie = empSetCookie ? empSetCookie.split(';')[0] : '';

  console.log('\n--- 3. Testing RBAC & IDOR Protections with Employee Session ---');
  // Employee trying to access GET /api/employes
  const resEmpList = await fetch(BASE + '/api/employes', { headers: { Cookie: empCookie } });
  console.log('Employee accessing /api/employes (should be 403):', resEmpList.status);

  // Employee trying to access /api/employes/emp-admin-01 (IDOR)
  const resEmpIdor = await fetch(BASE + '/api/employes/emp-admin-01', { headers: { Cookie: empCookie } });
  console.log('Employee accessing another employee ID /api/employes/emp-admin-01 (should be 403):', resEmpIdor.status);

  // Employee trying to access /api/affectations
  const resEmpAff = await fetch(BASE + '/api/affectations', { headers: { Cookie: empCookie } });
  console.log('Employee accessing /api/affectations (should be 403):', resEmpAff.status);

  // Employee trying to access /api/interventions
  const resEmpInt = await fetch(BASE + '/api/interventions', { headers: { Cookie: empCookie } });
  console.log('Employee accessing /api/interventions (should be 403):', resEmpInt.status);

  // Employee trying to access /api/dashboard/stats
  const resEmpStats = await fetch(BASE + '/api/dashboard/stats', { headers: { Cookie: empCookie } });
  console.log('Employee accessing /api/dashboard/stats (should be 403):', resEmpStats.status);

  // Employee accessing own /api/employe/me
  const resEmpMe = await fetch(BASE + '/api/employe/me', { headers: { Cookie: empCookie } });
  console.log('Employee accessing own /api/employe/me (should be 200):', resEmpMe.status);

  console.log('\n--- 4. Testing Forged & Tampered Session Tokens ---');
  const resForged = await fetch(BASE + '/api/employes', {
    headers: { Cookie: 'touba_gaz_session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJyb2xlIjoiYWRtaW4ifQ.fake_signature' }
  });
  console.log('Forged token on /api/employes (should be 401):', resForged.status);

  const resUnsigned = await fetch(BASE + '/api/employes', {
    headers: { Cookie: 'touba_gaz_session={"id":"1","role":"admin"}' }
  });
  console.log('Unsigned JSON token on /api/employes (should be 401):', resUnsigned.status);

  console.log('\n--- 5. Testing Admin Access to Admin APIs ---');
  const resAdminList = await fetch(BASE + '/api/employes', { headers: { Cookie: adminCookie } });
  console.log('Admin accessing /api/employes (should be 200):', resAdminList.status);
  const resAdminStats = await fetch(BASE + '/api/dashboard/stats', { headers: { Cookie: adminCookie } });
  console.log('Admin accessing /api/dashboard/stats (should be 200):', resAdminStats.status);

  console.log('\n--- ALL SECURITY VALIDATIONS COMPLETED ---');
})();
