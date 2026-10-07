'use strict';
try { require('dotenv').config(); } catch {}
const {createClient} = require('@supabase/supabase-js');
const {products} = require('./public/pos');

const validIds = new Set(products.map(p => p.id));
let supabase;

function getClient() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://orszqpelenutpecokbad.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_0tSIizn3zrx3LcOYElz_yw_7k2NyFnV';
    supabase = createClient(url, key);
  }
  return supabase;
}

async function initialize() {
  const {error} = await getClient().from('bite_brew_sales').select('id').limit(1);
  if (error) throw new Error('Cannot reach bite_brew_sales table: ' + error.message);
}

function validate(input) {
  if (!input || typeof input !== 'object') throw new Error('Invalid sale data.');
  const {reference, date, items, total, method, status} = input;
  if (typeof reference !== 'string' || !/^BB-/i.test(reference)) throw new Error('Invalid reference format.');
  if (typeof date !== 'string' || !Date.parse(date)) throw new Error('Invalid date.');
  if (!Array.isArray(items) || items.length === 0) throw new Error('Invalid items: order must have at least one item.');
  for (const item of items) {
    if (!validIds.has(item.id)) throw new Error(`Invalid product: ${item.id}.`);
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error(`Invalid quantity for ${item.id}.`);
    if (!Number.isInteger(item.price) || item.price < 0) throw new Error(`Invalid price for ${item.id}.`);
    if (!Number.isInteger(item.subtotal) || item.subtotal !== item.price * item.quantity) throw new Error(`Invalid subtotal for ${item.id}.`);
  }
  const expectedTotal = items.reduce((s, p) => s + p.subtotal, 0);
  if (!Number.isInteger(total) || total !== expectedTotal) throw new Error('Invalid total: does not match items.');
  if (!Number.isInteger(input.paid) || input.paid < total) throw new Error('Insufficient payment.');
  if (!Number.isInteger(input.change) || input.change !== input.paid - total) throw new Error('Invalid change amount.');
  if (!['Cash', 'QR Payment', 'Credit/Debit Card'].includes(method)) throw new Error('Invalid payment method.');
  if (status !== 'Payment Successful') throw new Error('Invalid status.');
}

function toReceipt(row) {
  return {
    reference: row.reference,
    date: row.date,
    items: row.items,
    total: row.total,
    paid: row.paid,
    change: row.change,
    method: row.method,
    status: row.status,
  };
}

async function saveSale(input) {
  validate(input);
  const db = getClient();
  const row = {
    reference: input.reference,
    date: input.date,
    items: input.items,
    total: input.total,
    paid: input.paid,
    change: input.change,
    method: input.method,
    status: input.status,
  };

  const {data: inserted, error: insertError} = await db
    .from('bite_brew_sales')
    .insert(row)
    .select()
    .single();

  if (!insertError) return toReceipt(inserted);

  if (insertError.code === '23505') {
    const {data: existing, error: fetchError} = await db
      .from('bite_brew_sales')
      .select()
      .eq('reference', input.reference)
      .single();
    if (fetchError) throw new Error(fetchError.message);
    return toReceipt(existing);
  }

  throw new Error(insertError.message);
}

module.exports = {initialize, saveSale};
