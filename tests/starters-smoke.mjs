import { spawn } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'cfd-starters-'));
const processes = [];

const freePort = () => new Promise((resolvePort, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => resolvePort(port));
  });
});

const startProcess = (command, args, options = {}) => {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
  child.output = '';
  child.stdout.on('data', (chunk) => { child.output += chunk; });
  child.stderr.on('data', (chunk) => { child.output += chunk; });
  processes.push(child);
  return child;
};

const waitForUrl = async (url, child) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Server stopte te vroeg:\n${child.output}`);
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // De server heeft nog een moment nodig.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Server werd niet bereikbaar:\n${child.output}`);
};

const stopProcess = async (child) => {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolveExit) => child.once('exit', resolveExit)),
    new Promise((resolveWait) => setTimeout(resolveWait, 1500)),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
};

async function testPhpSqliteStarter() {
  const source = join(root, 'starter', 'studenten-crud');
  const target = join(temporaryRoot, 'studenten-crud');
  cpSync(source, target, { recursive: true });
  const port = await freePort();
  const server = startProcess('php', ['-S', `127.0.0.1:${port}`, '-t', target], { cwd: target });

  try {
    const baseUrl = `http://127.0.0.1:${port}/`;
    let response = await waitForUrl(baseUrl, server);
    let html = await response.text();
    const cookie = (response.headers.get('set-cookie') || '').split(';')[0];
    let token = html.match(/name="_token" value="([^"]+)"/)?.[1];
    const countryId = html.match(/<option value="(\d+)"[^>]*>\s*Suriname/)?.[1];
    if (!cookie || !token || !countryId) throw new Error('PHP-starter mist sessie, CSRF-token of startland.');

    const post = async (body) => {
      const postResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
        body: new URLSearchParams(body),
        redirect: 'manual',
      });
      if (postResponse.status !== 302) throw new Error(`PHP POST gaf status ${postResponse.status}.`);
      const pageResponse = await fetch(new URL(postResponse.headers.get('location') || '/', baseUrl), { headers: { cookie } });
      return pageResponse.text();
    };

    html = await post({
      _token: token, intent: 'create_student', return_page: 'students', studentnummer: 'RELEASE-PHP-001',
      voornaam: 'Release', achternaam: 'Controle', email: 'release-php@example.test',
      opleiding: 'Softwareontwikkeling', land_id: countryId, status: 'actief',
    });
    if (!html.includes('RELEASE-PHP-001')) throw new Error('PHP Create/Read is mislukt.');
    const studentId = html.match(/edit_student=(\d+)/)?.[1];
    token = html.match(/name="_token" value="([^"]+)"/)?.[1];
    if (!studentId || !token) throw new Error('PHP-starter toont het nieuwe record of token niet.');

    html = await post({
      _token: token, intent: 'update_student', return_page: 'students', id: studentId,
      studentnummer: 'RELEASE-PHP-001', voornaam: 'Gewijzigde', achternaam: 'Controle',
      email: 'release-php@example.test', opleiding: 'Softwareontwikkeling', land_id: countryId,
      status: 'afgestudeerd',
    });
    if (!html.includes('Gewijzigde') || !html.includes('afgestudeerd')) throw new Error('PHP Update is mislukt.');
    token = html.match(/name="_token" value="([^"]+)"/)?.[1];
    html = await post({ _token: token, intent: 'delete_student', return_page: 'students', id: studentId });
    if (html.includes('RELEASE-PHP-001')) throw new Error('PHP Delete is mislukt.');
  } finally {
    await stopProcess(server);
  }
}

async function testJavaScriptSqliteStarter() {
  const project = join(root, 'starter', 'javascript-sqlite-crud');
  if (!existsSync(join(project, 'node_modules'))) {
    throw new Error('JavaScript-starterpackages ontbreken. Voer eerst npm ci --prefix starter/javascript-sqlite-crud uit.');
  }
  const dataDirectory = join(temporaryRoot, 'javascript-data');
  const port = await freePort();
  const server = startProcess(process.execPath, ['backend/server.js'], {
    cwd: project,
    env: { ...process.env, PORT: String(port), CFD_DATA_DIR: dataDirectory },
  });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForUrl(`${baseUrl}/api/countries`, server);
    const countries = await fetch(`${baseUrl}/api/countries`).then((response) => response.json());
    const firstCountryId = Number(countries[0]?.id);
    const secondCountryId = Number(countries[1]?.id);
    if (!firstCountryId || !secondCountryId) throw new Error('JavaScript-starter mist startlanden.');

    const student = {
      studentNumber: 'RELEASE-JS-001', firstName: 'Release', lastName: 'Controle',
      email: 'release-js@example.test', education: 'Softwareontwikkeling',
      countryId: firstCountryId, status: 'active',
    };
    let response = await fetch(`${baseUrl}/api/students`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(student),
    });
    const created = await response.json();
    if (response.status !== 201 || !created.id || !created.countryName) throw new Error('JavaScript Create/JOIN Read is mislukt.');

    response = await fetch(`${baseUrl}/api/students/${created.id}`, {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...student, firstName: 'Gewijzigde', countryId: secondCountryId, status: 'graduated' }),
    });
    const updated = await response.json();
    if (!response.ok || updated.firstName !== 'Gewijzigde' || updated.countryId !== secondCountryId) {
      throw new Error('JavaScript Update van de relatie is mislukt.');
    }

    response = await fetch(`${baseUrl}/api/countries/${secondCountryId}`, { method: 'DELETE' });
    if (response.status !== 400) throw new Error('JavaScript RESTRICT-controle is mislukt.');
    response = await fetch(`${baseUrl}/api/students/${created.id}`, { method: 'DELETE' });
    if (response.status !== 204) throw new Error('JavaScript Delete is mislukt.');
    const rows = await fetch(`${baseUrl}/api/students`).then((result) => result.json());
    if (rows.some((row) => row.studentNumber === student.studentNumber)) throw new Error('JavaScript-record bestaat nog na Delete.');
  } finally {
    await stopProcess(server);
  }
}

try {
  await testPhpSqliteStarter();
  await testJavaScriptSqliteStarter();
  console.log('PHP + SQLite en JavaScript + SQLite starters: runtime CRUD + JOIN + RESTRICT PASS');
} finally {
  await Promise.all(processes.map(stopProcess));
  rmSync(temporaryRoot, { recursive: true, force: true });
}
