const {test}=require('node:test');const assert=require('node:assert/strict');
const {POS,products,money,parseCash}=require('../pos');
test('Database failure retains order and retry reference until saved',async()=>{
 const p=payment(order());p.cash='200';let reference;
 assert.equal(await p.pay(0,async r=>{reference=r.reference;throw new Error('Save unavailable');}),false);
 assert.equal(p.step,'payment');assert.equal(p.receipt,null);assert.equal(p.processing,false);assert.equal(p.total(),17500);
 assert.equal(await p.pay(0,async r=>{assert.equal(r.reference,reference);return r;}),true);
 assert.equal(p.receipt.reference,reference);assert.equal(p.step,'success');
});
function order(){const p=new POS();p.adjust('coffee',2);p.adjust('sandwich',1);p.adjust('soft-drink',1);return p;}
function payment(p,method='Cash'){p.navigate('review');p.navigate('payment');p.selectMethod(method);return p;}
test('Six products and peso formatting',()=>{assert.equal(products.length,6);assert.equal(money(4500),'₱45.00');assert.equal(money(0),'₱0.00');assert.equal(money(100000),'₱1,000.00');});
test('Exam totals, quantities, removal and back navigation',()=>{const p=order();assert.equal(p.total(),17500);p.adjust('coffee',1);assert.equal(p.total(),22000);p.adjust('coffee',-1);assert.equal(p.total(),17500);p.remove('soft-drink');assert.equal(p.total(),14000);const before=p.items();p.navigate('review');p.navigate('order');assert.deepEqual(p.items(),before);p.adjust('sandwich',-10);assert.equal(p.cart.sandwich,undefined);});
test('Empty checkout and out-of-order payment blocked',async()=>{const p=new POS();assert.equal(p.navigate('review'),false);assert.equal(await p.pay(),false);assert.equal(p.receipt,null);});
test('Invalid cash rejected without receipts',async()=>{for(const value of ['', 'abc','-1','100','1e3','200.001','Infinity','NaN','999999999999999999']){const p=order();p.remove('soft-drink');payment(p);p.cash=value;assert.equal(await p.pay(),false,value);assert.equal(p.step,'payment');assert.equal(p.receipt,null);assert.ok(p.error);}});
test('Cash 200 for 140, immutable consistent receipt and complete reset',async()=>{const p=order();p.remove('soft-drink');payment(p);p.cash='200';assert.equal(await p.pay(),true);assert.equal(p.receipt.total,14000);assert.equal(p.receipt.paid,20000);assert.equal(p.receipt.change,6000);assert.equal(p.receipt.items.reduce((s,i)=>s+i.subtotal,0),p.receipt.total);assert.ok(Object.isFrozen(p.receipt));assert.ok(!isNaN(Date.parse(p.receipt.date)));assert.equal(await p.pay(),false);p.navigate('receipt');p.reset();assert.deepEqual(p.cart,{});assert.equal(p.total(),0);assert.equal(p.cash,'');assert.equal(p.method,null);assert.equal(p.receipt,null);assert.equal(p.processing,false);assert.equal(p.step,'order');assert.equal(p.error,'');});
test('Exact cash and centavos',async()=>{const p=payment(order());p.cash='175.00';await p.pay();assert.equal(p.receipt.change,0);assert.equal(parseCash('200.01'),20001);});
test('QR/card receipts, card processing lock, unique references',async()=>{const q=payment(order(),'QR Payment');await q.pay();assert.equal(q.receipt.method,'QR Payment');assert.equal(q.receipt.paid,q.receipt.total);assert.equal(q.receipt.change,0);const c=payment(order(),'Credit/Debit Card');const pending=c.pay(20);assert.equal(c.processing,true);assert.equal(c.navigate('review'),false);assert.equal(await c.pay(),false);await pending;assert.equal(c.receipt.method,'Credit/Debit Card');assert.equal(c.receipt.change,0);assert.equal(c.receipt.paid,c.receipt.total);assert.notEqual(c.receipt.reference,q.receipt.reference);});
