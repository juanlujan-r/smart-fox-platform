#!/usr/bin/env node

/**
 * Script to reset all test user passwords to a standard password
 * Usage: node scripts/reset-test-user-passwords.js [environment]
 * 
 * environment: 'local' (default) or 'remote'
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const TEST_USERS = [
  'supervisor1@smartfox.com',
  'supervisor2@smartfox.com',
  'emp1@smartfox.com',
  'emp2@smartfox.com',
  'emp3@smartfox.com',
  'emp4@smartfox.com',
  'emp5@smartfox.com',
  'emp6@smartfox.com',
  'emp7@smartfox.com',
  'emp8@smartfox.com',
  'emp9@smartfox.com',
  'emp10@smartfox.com',
];

const NEW_PASSWORD = 'Test1234!';

const environment = process.argv[2] || 'local';
const isRemote = environment === 'remote';

// Get Supabase credentials
const supabaseUrl = isRemote
  ? process.env.REMOTE_SUPABASE_URL || 'https://uzwrpnvdilcltozonkpj.supabase.co'
  : process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';

const serviceRoleKey = isRemote
  ? process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.error(`   Make sure you have set the correct environment for ${environment}`);
  process.exit(1);
}

console.log(`\n🔧 Resetting test user passwords (${environment.toUpperCase()})`);
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Users: ${TEST_USERS.length}`);
console.log(`   New Password: ${NEW_PASSWORD}\n`);

// Initialize Supabase Admin Client
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Reset password for a single user
 */
async function resetUserPassword(email) {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      // First, get the user by email
      (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id,
      { password: NEW_PASSWORD }
    );

    if (error) throw error;
    return { success: true, email };
  } catch (err) {
    return { success: false, email, error: err.message };
  }
}

/**
 * Find user ID by email
 */
async function getUserIdByEmail(email) {
  try {
    // Use admin API to list users and find by email
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;
    
    const user = data.users.find(u => u.email === email);
    return user?.id || null;
  } catch (err) {
    console.error(`Error finding user ${email}:`, err.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('📋 Fetching test users...\n');
    
    // Get all users
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) throw usersError;
    
    const allUsers = usersData.users;
    const testUsersMap = new Map();
    
    // Find test users
    TEST_USERS.forEach(email => {
      const user = allUsers.find(u => u.email === email);
      if (user) {
        testUsersMap.set(email, user.id);
      }
    });
    
    console.log(`✅ Found ${testUsersMap.size} test users\n`);
    
    if (testUsersMap.size === 0) {
      console.warn('⚠️  No test users found!');
      process.exit(1);
    }
    
    // Reset passwords
    console.log('🔐 Resetting passwords...\n');
    
    let successful = 0;
    let failed = 0;
    
    for (const [email, userId] of testUsersMap) {
      try {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: NEW_PASSWORD,
        });
        
        if (error) {
          console.log(`❌ ${email}: ${error.message}`);
          failed++;
        } else {
          console.log(`✅ ${email}`);
          successful++;
        }
      } catch (err) {
        console.log(`❌ ${email}: ${err.message}`);
        failed++;
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 RESUMEN:`);
    console.log(`   ✅ Exitosos: ${successful}`);
    console.log(`   ❌ Fallidos: ${failed}`);
    console.log(`   📝 Total: ${successful + failed}`);
    console.log(`${'='.repeat(50)}\n`);
    
    if (failed === 0) {
      console.log('✨ ¡Todas las contraseñas han sido actualizadas correctamente!');
      console.log(`\n📋 Credenciales de prueba:`);
      console.log(`   Email: usuario@smartfox.com`);
      console.log(`   Contraseña: ${NEW_PASSWORD}\n`);
    } else {
      console.warn(`⚠️  ${failed} usuarios no pudieron ser actualizados`);
      process.exit(1);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
