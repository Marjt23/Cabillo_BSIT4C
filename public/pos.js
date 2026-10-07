(function (root) {
  'use strict';
  const products = [
    {id:'coffee', name:'Coffee', price:4500, category:'Drinks', icon:'☕', description:'Your daily cup of comfort', photo:'photo-1509042239860-f550ce710b93'},
    {id:'sandwich', name:'Sandwich', price:5000, category:'Food', icon:'🥪', description:'A satisfying campus classic', photo:'photo-1528735602780-2552fd46c7af'},
    {id:'soft-drink', name:'Soft Drink', price:3500, category:'Drinks', icon:'🥤', description:'Chilled, fizzy & refreshing', photo:'photo-1622483767028-3f66f32aef97'},
    {id:'cookies', name:'Cookies', price:2500, category:'Snacks', icon:'🍪', description:'A sweet little pick-me-up', photo:'photo-1499636136210-6f4ee915583e'},
    {id:'water', name:'Bottled Water', price:2000, category:'Drinks', icon:'💧', description:'Stay refreshed between classes', photo:'photo-1602143407151-7111542de6e8'},
    {id:'chocolate', name:'Chocolate', price:2500, category:'Snacks', icon:'🍫', description:'Rich, smooth & happily sweet', photo:'photo-1511381939415-e44015466834'}
  ];
  const money = cents => '₱' + (cents / 100).toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2});
  function parseCash(value) {
    const s = String(value).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
    const [whole, fraction=''] = s.split('.');
    const result = Number(whole)*100 + Number(fraction.padEnd(2,'0'));
    return Number.isSafeInteger(result) ? result : null;
  }
  class POS {
    constructor() { this.reset(); }
    reset() { this.cart={}; this.step='order'; this.method=null; this.cash=''; this.receipt=null; this.processing=false; this.error=''; this.pendingReference=null; }
    items() { return products.filter(p=>this.cart[p.id]).map(p=>({...p, quantity:this.cart[p.id], subtotal:p.price*this.cart[p.id]})); }
    total() { return this.items().reduce((s,p)=>s+p.subtotal,0); }
    count() { return this.items().reduce((s,p)=>s+p.quantity,0); }
    adjust(id, delta) {
      if(this.step!=='order' || !products.some(p=>p.id===id) || !Number.isInteger(delta)) return;
      const q=Math.max(0,(this.cart[id]||0)+delta);
      if(q) this.cart[id]=q; else delete this.cart[id];
    }
    remove(id) { if(this.step==='order') delete this.cart[id]; }
    clearOrder() { if(this.step!=='order'||!this.count()) return false; this.cart={}; this.method=null; this.cash=''; this.error=''; return true; }
    navigate(step) {
      const allowed={order:['review'],review:['order','payment'],payment:['review','order'],success:['receipt']};
      if(this.processing || !allowed[this.step]?.includes(step) || (step!=='order'&&!this.total())) return false;
      this.step=step; this.error='';
      if(step==='order'||step==='review') {this.method=null; this.cash='';}
      return true;
    }
    selectMethod(method) { if(this.step==='payment'&&!this.processing&&['Cash','QR Payment','Credit/Debit Card',null].includes(method)) {this.method=method;this.cash='';this.error='';} }
    validatePayment() {
      if(this.step!=='payment'||this.receipt||this.processing||!this.total()||!this.method) return {error:'Select a payment method for a non-empty order.'};
      const paid=this.method==='Cash'?parseCash(this.cash):this.total();
      if(paid===null) return {error:'Enter a valid, non-negative amount with up to two decimal places.'};
      if(paid<this.total()) return {error:`Insufficient payment. Please enter at least ${money(this.total())}. You are short by ${money(this.total()-paid)}.`};
      return {paid};
    }
    async pay(delay=1200,save=null) {
      const result=this.validatePayment();
      if(result.error) {if(!this.processing&&!this.receipt) this.error=result.error; return false;}
      this.processing=true; this.error='';
      if(this.method==='Credit/Debit Card') await new Promise(resolve=>setTimeout(resolve,delay));
      const items=this.items().map(p=>Object.freeze({...p}));
      const uuid=root.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${++POS.sequence}-${Math.random().toString(36).slice(2)}`;
      this.pendingReference ||= 'BB-'+uuid.toUpperCase();
      let receipt={reference:this.pendingReference, date:new Date().toISOString(), items:Object.freeze(items), total:this.total(), paid:result.paid, change:result.paid-this.total(), method:this.method, status:'Payment Successful'};
      try{if(save)receipt=await save(receipt);}catch(error){this.processing=false;this.error=error.message||'Could not save your sale. Please retry.';return false;}
      this.receipt=Object.freeze({...receipt,items:Object.freeze(receipt.items.map(item=>Object.freeze({...item})))});
      this.processing=false; this.step='success'; return true;
    }
  }
  POS.sequence=0;
  const api={POS,products,money,parseCash};
  if(typeof module!=='undefined') module.exports=api; else root.BiteBrew=api;
})(typeof globalThis!=='undefined'?globalThis:this);
