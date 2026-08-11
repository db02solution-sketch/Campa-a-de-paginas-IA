import { randomUUID } from 'crypto';
import { getStore, supabase, useMemory } from '../lib/supabase.js';

export async function getAdminByEmail(email) {
  if (useMemory) {
    const admins = getStore().admin_users || [];
    return admins.find((a) => a.email === email) || null;
  }
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAdminById(id) {
  if (useMemory) {
    const admins = getStore().admin_users || [];
    return admins.find((a) => a.id === id) || null;
  }
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listAdmins() {
  if (useMemory) return getStore().admin_users || [];
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createAdminUser(payload) {
  const { email, role = 'admin', permissions = {}, is_active = true } = payload;

  if (useMemory) {
    const store = getStore();
    if (!store.admin_users) store.admin_users = [];
    
    const existingAdmin = store.admin_users.find((a) => a.email === email);
    if (existingAdmin) {
      throw new Error('Admin user with this email already exists');
    }

    const admin = {
      id: randomUUID(),
      email,
      role,
      permissions,
      is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    store.admin_users.push(admin);
    return admin;
  }

  const { data, error } = await supabase
    .from('admin_users')
    .insert({ email, role, permissions, is_active })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateAdminUser(id, patch) {
  if (useMemory) {
    const store = getStore();
    if (!store.admin_users) store.admin_users = [];
    
    const idx = store.admin_users.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    
    store.admin_users[idx] = {
      ...store.admin_users[idx],
      ...patch,
      updated_at: new Date().toISOString()
    };
    return store.admin_users[idx];
  }

  const { data, error } = await supabase
    .from('admin_users')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteAdminUser(id) {
  if (useMemory) {
    const store = getStore();
    if (!store.admin_users) store.admin_users = [];
    
    const idx = store.admin_users.findIndex((a) => a.id === id);
    if (idx < 0) return false;
    
    store.admin_users.splice(idx, 1);
    return true;
  }

  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function verifyAdminToken(token) {
  if (useMemory) {
    return token === 'dev-admin-token';
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return false;

    const admin = await getAdminById(data.user.id);
    return admin && admin.is_active;
  } catch (error) {
    return false;
  }
}

export async function createInitialAdmin() {
  const existingAdmin = await getAdminByEmail('admin@localhost');
  if (existingAdmin) return existingAdmin;

  return createAdminUser({
    email: 'admin@localhost',
    role: 'super_admin',
    permissions: {
      campaigns: { read: true, write: true, delete: true },
      leads: { read: true, write: true, delete: true },
      proposals: { read: true, write: true, delete: true },
      admin_users: { read: true, write: true, delete: true },
      clients: { read: true, write: true, delete: true }
    },
    is_active: true
  });
}
