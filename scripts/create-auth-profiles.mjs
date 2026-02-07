import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (c === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

async function main() {
  loadEnvFile(path.resolve('.env.local'));
  loadEnvFile(path.resolve('.env'));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const csvPath = process.argv[2];
  if (!csvPath) {
    throw new Error('Usage: node scripts/create-auth-profiles.mjs data/users.csv');
  }

  const raw = fs.readFileSync(csvPath, 'utf8').trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV must include header and at least one row');
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((l) => parseCsvLine(l));
  const records = rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));

  const supabase = createClient(url, serviceKey);

  const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 2000 });
  const emailToId = new Map((existing?.users ?? []).map((u) => [u.email?.toLowerCase(), u.id]));

  for (const row of records) {
    const email = (row.email || '').toLowerCase();
    const password = row.password || 'Test1234!';
    const role = row.role || 'empleado';

    let userId = emailToId.get(email);
    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, full_name: row.full_name || '' },
      });

      if (error) throw error;
      userId = data.user.id;
      emailToId.set(email, userId);
    }

    const baseSalary = row.base_salary ? Number(row.base_salary) : 0;

    const personal_data = {
      email,
      phone: row.phone || '',
      address: row.address || '',
      city: row.city || '',
      emergency_name: row.emergency_name || '',
      emergency_phone: row.emergency_phone || '',
    };

    const medical_data = {
      eps: row.eps || '',
      arl: row.arl || '',
      blood_type: row.blood_type || '',
    };

    const bank_account = {
      account_number: row.account_number || '',
      bank_name: row.bank_name || '',
      ach_code: row.ach_code || '',
      account_type: row.account_type || '',
    };

    const profile = {
      id: userId,
      role,
      full_name: row.full_name || null,
      first_name: row.first_name || null,
      last_name: row.last_name || null,
      document_id: row.document_id || null,
      document_type: row.document_type || 'CC',
      hiring_date: row.hiring_date || null,
      contract_type: row.contract_type || 'Indefinido',
      base_salary: baseSalary,
      eps: row.eps || null,
      arl: row.arl || null,
      pension_fund: row.pension_fund || null,
      severance_fund: row.severance_fund || null,
      blood_type: row.blood_type || null,
      personal_data,
      medical_data,
      bank_account,
    };

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' });

    if (upsertError) throw upsertError;
  }

  console.log('OK: usuarios y perfiles creados.');
}

main().catch((e) => {
  console.error('ERROR:', e.message || e);
  process.exit(1);
});
