/**
 * TESTS UNITARIOS - calculate_minute_rate()
 * Función crítica para cumplimiento Ley 2101
 * 
 * Ejecutar: npm run test:db
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

describe('calculate_minute_rate() - Ley 2101 Compliance', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;

  beforeAll(async () => {
    // Usar service role para tests
    supabase = createClient(supabaseUrl, serviceRoleKey);
  });

  beforeEach(async () => {
    // Crear usuario de prueba
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@test.com`,
      password: 'Test1234!',
      email_confirm: true,
    });

    if (authError) throw authError;
    testUserId = authData.user.id;
  });

  afterEach(async () => {
    // Limpiar usuario de prueba
    if (testUserId) {
      await supabase.from('profiles').delete().eq('id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Divisor Correcto (13,200 minutos - Feb 2026)', () => {
    it('debe calcular minute_rate correctamente para salario $2,000,000', async () => {
      const baseSalary = 2000000;
      const expectedRate = baseSalary / 13200; // 151.51515...

      const { data, error } = await supabase
        .from('profiles')
        .update({ base_salary: baseSalary })
        .eq('id', testUserId)
        .select('minute_rate')
        .single();

      expect(error).toBeNull();
      expect(data?.minute_rate).toBeCloseTo(expectedRate, 2);
    });

    it('debe calcular minute_rate correctamente para salario mínimo ($1,423,500)', async () => {
      const baseSalary = 1423500; // SMMLV 2026 Colombia
      const expectedRate = baseSalary / 13200; // 107.84...

      const { data, error } = await supabase
        .from('profiles')
        .update({ base_salary: baseSalary })
        .eq('id', testUserId)
        .select('minute_rate')
        .single();

      expect(error).toBeNull();
      expect(data?.minute_rate).toBeCloseTo(expectedRate, 2);
    });

    it('debe calcular minute_rate correctamente para salario ejecutivo ($5,500,000)', async () => {
      const baseSalary = 5500000;
      const expectedRate = baseSalary / 13200; // 416.67...

      const { data, error } = await supabase
        .from('profiles')
        .update({ base_salary: baseSalary })
        .eq('id', testUserId)
        .select('minute_rate')
        .single();

      expect(error).toBeNull();
      expect(data?.minute_rate).toBeCloseTo(expectedRate, 2);
    });
  });

  describe('Casos Edge', () => {
    it('debe manejar salario 0 sin errores', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ base_salary: 0 })
        .eq('id', testUserId)
        .select('minute_rate')
        .single();

      expect(error).toBeNull();
      expect(data?.minute_rate).toBe(0);
    });

    it('debe manejar salario NULL sin errores', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ base_salary: null })
        .eq('id', testUserId)
        .select('minute_rate')
        .single();

      expect(error).toBeNull();
    });

    it('debe recalcular minute_rate al actualizar base_salary', async () => {
      // Primer salario
      await supabase
        .from('profiles')
        .update({ base_salary: 2000000 })
        .eq('id', testUserId);

      // Actualizar a nuevo salario
      const newSalary = 3000000;
      const expectedRate = newSalary / 13200; // 227.27...

      const { data, error } = await supabase
        .from('profiles')
        .update({ base_salary: newSalary })
        .eq('id', testUserId)
        .select('minute_rate')
        .single();

      expect(error).toBeNull();
      expect(data?.minute_rate).toBeCloseTo(expectedRate, 2);
    });
  });

  describe('Validación contra Divisor Antiguo (12,600 - INCORRECTO)', () => {
    it('debe NO usar el divisor antiguo de 12,600', async () => {
      const baseSalary = 2000000;
      const wrongRate = baseSalary / 12600; // 158.73 (INCORRECTO)
      const correctRate = baseSalary / 13200; // 151.51 (CORRECTO)

      const { data } = await supabase
        .from('profiles')
        .update({ base_salary: baseSalary })
        .eq('id', testUserId)
        .select('minute_rate')
        .single();

      expect(data?.minute_rate).not.toBeCloseTo(wrongRate, 2);
      expect(data?.minute_rate).toBeCloseTo(correctRate, 2);
    });
  });

  describe('Labor Law Parameters (Función Dinámica)', () => {
    it('debe obtener parámetro laboral vigente desde tabla', async () => {
      const { data, error } = await supabase.rpc('get_labor_parameter', {
        p_country_code: 'CO',
        p_parameter_name: 'monthly_divisor_minutes',
        p_date: '2026-02-07',
      });

      expect(error).toBeNull();
      expect(data).toBe(13200); // Feb 2026 = 44h semanales
    });

    it('debe obtener parámetro futuro (julio 2026 - 42h)', async () => {
      const { data, error } = await supabase.rpc('get_labor_parameter', {
        p_country_code: 'CO',
        p_parameter_name: 'monthly_divisor_minutes',
        p_date: '2026-07-15', // Después del cambio
      });

      expect(error).toBeNull();
      expect(data).toBe(12600); // Julio 2026 = 42h semanales
    });

    it('debe retornar multipliers de horas extra correctos', async () => {
      const { data: hedData } = await supabase.rpc('get_labor_parameter', {
        p_country_code: 'CO',
        p_parameter_name: 'overtime_day_multiplier',
        p_date: '2026-02-07',
      });

      const { data: henData } = await supabase.rpc('get_labor_parameter', {
        p_country_code: 'CO',
        p_parameter_name: 'overtime_night_multiplier',
        p_date: '2026-02-07',
      });

      expect(hedData).toBe(1.25); // HED: +25%
      expect(henData).toBe(1.75); // HEN: +75%
    });
  });

  describe('Performance y Precisión', () => {
    it('debe calcular con precisión hasta 2 decimales', async () => {
      const baseSalary = 1234567;
      const expectedRate = Math.round((baseSalary / 13200) * 100) / 100;

      const { data } = await supabase
        .from('profiles')
        .update({ base_salary: baseSalary })
        .eq('id', testUserId)
        .select('minute_rate')
        .single();

      const actualRate = Math.round(data!.minute_rate * 100) / 100;
      expect(actualRate).toBe(expectedRate);
    });

    it('debe ejecutar en menos de 100ms', async () => {
      const startTime = Date.now();

      await supabase
        .from('profiles')
        .update({ base_salary: 2000000 })
        .eq('id', testUserId);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });
  });
});

describe('Security Alerts System', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, serviceRoleKey);
  });

  it('debe registrar alerta de webhook rechazado', async () => {
    const alert = {
      alert_type: 'webhook_rejected',
      severity: 'high',
      source: 'twilio',
      endpoint: '/api/twilio/test',
      details: {
        signature: 'invalid_sig_123',
        timestamp: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from('security_alerts')
      .insert(alert)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.alert_type).toBe('webhook_rejected');
    expect(data?.severity).toBe('high');
  });

  it('debe consultar dashboard de seguridad', async () => {
    const { data, error } = await supabase
      .from('security_dashboard')
      .select('*')
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('alerts_last_24h');
    expect(data).toHaveProperty('critical_alerts_last_24h');
    expect(data).toHaveProperty('rejected_webhooks_last_24h');
  });
});

/**
 * INSTRUCCIONES DE EJECUCIÓN
 * 
 * 1. Instalar dependencias:
 *    npm install --save-dev jest @types/jest ts-jest
 * 
 * 2. Configurar Jest (jest.config.js):
 *    module.exports = {
 *      preset: 'ts-jest',
 *      testEnvironment: 'node',
 *      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
 *    };
 * 
 * 3. Agregar script en package.json:
 *    "test:db": "jest tests/calculate_minute_rate.test.ts"
 * 
 * 4. Variables de entorno requeridas:
 *    NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
 *    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 * 
 * 5. Ejecutar:
 *    npm run test:db
 */
