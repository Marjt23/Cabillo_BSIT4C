'use strict';
const {POS,products,money,parseCash}=BiteBrew;
const pos=new POS(); let category='All'; let toastTimer;
const main=document.querySelector('#main');
let receiptTimer;
function openReceipt(){clearTimeout(receiptTimer);pos.navigate('receipt');render(true);}
function showTransactionPopup(){
 const r=pos.receipt;
 if(!r||pos.step!=='success')return;
 const content=`<div class="payment-success-popup"><div class="check" aria-hidden="true">✓</div><h2 id="transaction-popup-title">Payment Successful!</h2><p>Payment has been confirmed.</p><dl><div><dt>Amount paid</dt><dd>${money(r.paid)}</dd></div><div><dt>Change</dt><dd>${money(r.change)}</dd></div><div><dt>Payment</dt><dd>${r.method}</dd></div></dl><p class="popup-reference">${r.reference}</p><p class="opening-receipt" role="status">Opening your receipt…</p><div class="receipt-countdown" aria-hidden="true"><span></span></div>${button('View Receipt →','receipt','class="primary wide"')}</div>`;
 main.insertAdjacentHTML('beforeend',`<dialog class="transaction-popup success-dialog" aria-labelledby="transaction-popup-title">${content}</dialog>`);
 const dialog=main.querySelector('dialog');
 dialog.addEventListener('cancel',e=>{e.preventDefault();openReceipt();});
 dialog.showModal();
 receiptTimer=setTimeout(openReceipt,2600);
}
async function saveSale(receipt){
 const response=await fetch('/api/sales',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(receipt)});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error||'Could not save your sale. Please retry.');
 return result;
}
function notify(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3500);}
function button(label,action,extra=''){return `<button data-action="${action}" ${extra}>${label}</button>`;}
function heading(title,subtitle){return `<div class="page-heading"><div><span class="eyebrow">THE CAMPUS COLLECTION</span><h1 tabindex="-1">${title}</h1><p>${subtitle}</p></div><span class="pill">Takeaway</span></div>`;}
function rows(items){return items.map(p=>`<tr><td data-label="Product"><strong>${p.name}</strong></td><td data-label="Qty">${p.quantity}</td><td data-label="Unit price">${money(p.price)}</td><td data-label="Subtotal">${money(p.subtotal)}</td></tr>`).join('');}
function table(items){return `<div class="table-scroll"><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr></thead><tbody>${rows(items)}</tbody></table></div>`;}
function cart(){return `<section class="cart panel" id="cart"><div class="section-title"><h2>Your order</h2><span class="pill">${pos.count()} items</span></div><p class="muted">A good break starts here.</p><div class="cart-items">${pos.items().map(p=>`<article class="cart-item"><div class="item-head"><span class="mini-icon">${p.icon}</span><div><strong>${p.name}</strong><small>${money(p.price)} each</small></div><strong>${money(p.subtotal)}</strong></div><div class="quantity">${button('−','minus',`data-id="${p.id}" aria-label="Decrease ${p.name}"`)}<span aria-label="Quantity">${p.quantity}</span>${button('+','plus',`data-id="${p.id}" aria-label="Increase ${p.name}"`)}${button('Remove','remove',`class="remove" data-id="${p.id}" aria-label="Remove ${p.name}"`)}</div></article>`).join('')||'<div class="empty"><span>♧</span><h3>Your order is empty</h3><p>Tap something delicious<br>to get started.</p></div>'}</div><div class="cart-bottom"><div class="total"><span>Total</span><strong>${money(pos.total())}</strong></div>${button('Review order <span>→</span>','review',`class="primary wide" ${!pos.count()?'disabled':''}`)}<small>Review your items before payment</small></div></section>`;}
function order(){return `<section class="welcome" aria-label="Welcome to Bite and Brew"><h2>Bite &amp; Brew</h2><p>A little break. A better day.</p><span class="badge">Made for campus life.</span></section><div class="order-layout"><section>${heading('Something for every break.','Fresh bites & your favorite drinks. Tap a card to add it to your order.')}<div class="banner"><span>♨</span><div><strong>Good food. Better campus days.</strong><p>Choose your favorites, then make them yours.</p></div><span class="banner-art">☕</span></div><div class="filters" aria-label="Product categories">${['All','Drinks','Food','Snacks'].map(c=>button(c,'filter',`data-category="${c}" class="${category===c?'selected':''}" aria-pressed="${category===c}"`)).join('')}</div><div class="product-grid">${products.filter(p=>category==='All'||p.category===category).map(p=>`<button class="product" data-action="add" data-id="${p.id}" aria-label="Add ${p.name}, ${money(p.price)}"><div class="product-image"><span class="photo-fallback">${p.icon}</span><img src="https://images.unsplash.com/${p.photo}?auto=format&fit=crop&w=600&q=80" alt="${p.name}" onerror="this.hidden=true"><span class="product-tag">${p.category}</span>${pos.cart[p.id]?`<span class="in-cart">${pos.cart[p.id]} in order</span>`:''}</div><div class="product-body"><div><h3>${p.name}</h3><strong class="price">${money(p.price)}</strong></div><p>${p.description}</p><div class="product-footer"><span>Made for your break</span><span class="add-pill">+ Add</span></div></div></button>`).join('')}</div><p class="menu-foot">A bite to eat. A brew to go. A moment for you.</p></section>${cart()}</div>`;}
const paymentOptions=[
 {method:'Cash',label:'Cash',icon:'💵',description:'Pay with bills and coins'},
 {method:'QR Payment',label:'QR Payment',icon:'📱',description:'GCash, Maya, or any QR app'},
 {method:'Credit/Debit Card',label:'Credit / Debit Card',icon:'💳',description:'Tap, insert, or swipe'}
];
function demoQR(){
 let cells='';
 for(let y=0;y<29;y++)for(let x=0;x<29;x++){
  const corner=[[0,0],[22,0],[0,22]].find(([cx,cy])=>x>=cx&&x<cx+7&&y>=cy&&y<cy+7);
  let filled;
  if(corner){const dx=x-corner[0],dy=y-corner[1];filled=dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4);}
  else if((x<=7&&y<=7)||(x>=21&&y<=7)||(x<=7&&y>=21))filled=false;
  else filled=((x*17+y*31+x*y*7)%11)<6;
  if(filled)cells+=`<rect x="${x+3}" y="${y+3}" width="1" height="1"/>`;
 }
 return `<svg viewBox="0 0 35 35" role="img" aria-label="Demo QR pattern, not a real payment code" shape-rendering="crispEdges"><rect width="35" height="35" fill="white"/><g fill="#173e34">${cells}</g></svg>`;
}
function payment(){
 const option=paymentOptions.find(o=>o.method===pos.method);
 return `<section class="payment-screen"><div class="payment-heading"><h1 tabindex="-1">How would you like to pay?</h1><p>Amount Due: ${money(pos.total())}</p></div>${option?`<section class="panel payment-main"><div class="payment-panel-heading"><h2><span aria-hidden="true">${option.icon}</span> ${option.label}</h2>${button('Change method','change-method',`class="change-method" ${pos.processing?'disabled':''}`)}</div>${paymentDetails()}${pos.error&&pos.method!=='Cash'?'<p class="error" role="alert">'+pos.error+'</p>':''}</section>`:`<div class="methods payment-choices">${paymentOptions.map(o=>button(`<span class="payment-icon" aria-hidden="true">${o.icon}</span><strong>${o.label}</strong><small>${o.description}</small>`,'method',`data-method="${o.method}" aria-label="${o.label}"`)).join('')}</div>`}${button('← Back to Review','back-review',`class="secondary wide payment-back" ${pos.processing?'disabled':''}`)}</section>`;
}
function paymentDetails(){
 if(!pos.method)return '<div class="payment-prompt"><span>↟</span><h3>Your break is almost ready.</h3><p>Select one of the payment options above.</p></div>';
 if(pos.method==='Cash')return `<div class="cash-panel"><h2>Cash payment</h2><label for="cash">Amount paid (₱)</label><input id="cash" inputmode="decimal" autocomplete="off" placeholder="0.00" aria-describedby="payment-error" value="${pos.cash.replace(/[^0-9.\-]/g,'')}" maxlength="16"><div id="payment-error" role="alert" class="error">${pos.error}</div><p class="muted">Quick amounts</p><div class="quick">${button('Exact','quick',`data-value="${(pos.total()/100).toFixed(2)}"`)}${[200,500,1000].map(n=>button(money(n*100),'quick',`data-value="${n.toFixed(2)}"`)).join('')}</div><div class="change"><span>Change</span><strong id="change">${cashChange()}</strong></div><div class="keypad">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(n=>button(n,'key',`data-key="${n}" aria-label="${n==='⌫'?'Backspace':n}"`)).join('')}</div>${button('Clear','clear','class="secondary wide"')}${button('Pay Now →','pay','class="primary wide pay"')}</div>`;
 if(pos.method==='QR Payment')return `<div class="qr-payment"><div class="demo-qr">${demoQR()}</div><p class="demo-caption">Simulated QR · No real payment</p><div class="payment-amount"><span>Amount to pay</span><strong>${money(pos.total())}</strong><div class="payment-reference"><span>Reference No.</span><strong>${pos.pendingReference}</strong></div></div><div class="payment-instructions"><h3>Instructions</h3><ol><li>Open GCash, Maya, or any QR payment app.</li><li>In a live checkout, scan the payment code.</li><li>Verify the amount and reference number.</li><li>For this demo, tap Confirm Payment below.</li></ol><p>This demo code cannot accept payments.</p></div>${button('Confirm Payment','pay',`class="primary wide" ${pos.processing?'disabled':''}`)}${pos.processing?'<p role="status">Saving payment…</p>':''}</div>`;
 return `<div class="card-payment"><div class="terminal-card"><div class="terminal-top"><div><small>BITE &amp; BREW CARD</small><strong>Payment Terminal</strong></div><span aria-hidden="true">💳</span></div><div class="terminal-number">•••• •••• •••• 4821</div><div class="terminal-bottom"><div><small>CARDHOLDER</small><strong>CUSTOMER</strong></div><div><small>EXP</small><strong>12/28</strong></div></div></div><div class="payment-amount"><span>Amount Due</span><strong>${money(pos.total())}</strong></div><div class="card-instructions"><span aria-hidden="true">💳</span><h3>Please tap, insert, or swipe your card.</h3><p>This is a simulated terminal.</p></div>${pos.processing?'<div class="processing" role="status"><span class="spinner"></span> Processing payment…<small>Please wait until payment is complete.</small></div>':button('Process Payment','pay','class="primary wide"')}</div>`;
}
function cashChange(){const paid=parseCash(pos.cash);return paid!==null&&paid>=pos.total()?money(paid-pos.total()):'—';}
function details(r){return `<dl><div><dt>Transaction reference</dt><dd class="reference">${r.reference}</dd></div><div><dt>Payment method</dt><dd>${r.method}</dd></div><div><dt>Total</dt><dd>${money(r.total)}</dd></div><div><dt>Amount paid</dt><dd>${money(r.paid)}</dd></div><div><dt>Change</dt><dd>${money(r.change)}</dd></div></dl>`;}
function success(){const r=pos.receipt;return `<section class="panel success"><div class="check">✓</div><span class="eyebrow">BITE &amp; BREW</span><h1 tabindex="-1">Payment Successful</h1><p>Thank you! Your campus break is on its way.</p>${details(r)}${button('View Receipt →','receipt','class="primary wide"')}</section>`;}
function receipt(){const r=pos.receipt;return `${heading('Your receipt','Keep this for your records. Start a new transaction when you’re done.')}<div class="receipt-layout"><section class="panel receipt"><div class="receipt-brand"><span class="logo">♨</span><h1 tabindex="-1">Bite &amp; Brew POS</h1><p>Campus Store · Digital Receipt</p></div><p class="reference">${r.reference}</p><p class="receipt-date">${new Date(r.date).toLocaleString('en-PH',{timeZone:'Asia/Manila',dateStyle:'long',timeStyle:'medium'})} (Philippine time)</p>${table(r.items)}<div class="total"><span>TOTAL</span><strong>${money(r.total)}</strong></div>${details(r)}<p class="paid-status">✓ ${r.status}</p><p class="thanks">Thank you for your purchase!<br><small>See you at your next break.</small></p></section><section class="receipt-controls"><h2>All set. Enjoy your break.</h2><p>Your transaction is complete. Starting a new transaction clears your order and payment details.</p>${button('New Transaction →','new','class="primary wide"')}${button('Print Receipt','print','class="secondary wide"')}<small>Printing is optional.</small></section></div>`;}
function render(focus=false){
 clearTimeout(receiptTimer);
 main.querySelector('dialog')?.close();
 const index={order:0,review:1,payment:2,success:2,receipt:3}[pos.step];
 document.querySelector('#progress').innerHTML=['Order','Review','Payment','Receipt'].map((s,i)=>`<div class="step ${i===index?'active':''} ${i<index?'done':''}" ${i===index?'aria-current="step"':''}><span>${i<index?'✓':i+1}</span><strong>${s}</strong></div>`).join('');
 main.innerHTML=pos.step==='order'?order():pos.step==='review'?`${heading('Review your order','Check your items before paying. Go back to make any changes.')}<section class="panel review">${table(pos.items())}<div class="total"><span>Total · ${pos.count()} items</span><strong>${money(pos.total())}</strong></div><div class="actions">${button('← Back','back-order','class="secondary"')}${button('Continue to Payment →','payment','class="primary"')}</div></section>`:pos.step==='payment'?payment():pos.step==='success'?success():receipt();
 if(pos.step==='order')main.insertAdjacentHTML('beforeend',`<a class="mobile-cart" href="#cart"><span>View order · ${pos.count()} items</span><strong>${money(pos.total())} ↓</strong></a>`);
 if(focus){main.querySelector('h1')?.focus();window.scrollTo({top:0,behavior:'smooth'});}
 showTransactionPopup();
}
main.addEventListener('input',e=>{if(e.target.id==='cash'){pos.cash=e.target.value;pos.error='';document.querySelector('#payment-error').textContent='';document.querySelector('#change').textContent=cashChange();}});
main.addEventListener('click',async e=>{
 const b=e.target.closest('button[data-action]');if(!b||b.disabled||pos.processing)return;
 const a=b.dataset.action,id=b.dataset.id;
 if(a==='add'||a==='plus'||a==='minus'){pos.adjust(id,a==='minus'?-1:1);if(a==='add')notify('Product added — '+products.find(p=>p.id===id).name);render();}
 else if(a==='remove'){pos.remove(id);notify('Product removed');render();}
 else if(a==='filter'){category=b.dataset.category;render();}
 else if(a==='receipt'){openReceipt();}
 else if(['review','payment','back-order','back-review'].includes(a)){pos.navigate({'back-order':'order','back-review':'review'}[a]||a);render(true);}
 else if(a==='method'){pos.selectMethod(b.dataset.method);if(pos.method==='QR Payment')pos.pendingReference ||= 'BB-'+crypto.randomUUID().toUpperCase();render(true);}
 else if(a==='change-method'){pos.selectMethod(null);render(true);}
 else if(['quick','key','clear'].includes(a)){if(a==='quick')pos.cash=b.dataset.value;else if(a==='clear')pos.cash='';else if(b.dataset.key==='⌫')pos.cash=pos.cash.slice(0,-1);else if(pos.cash.length<16&&(b.dataset.key!=='.'||!pos.cash.includes('.')))pos.cash+=(b.dataset.key==='.'&&!pos.cash?'0':'')+b.dataset.key;pos.error='';render();}
 else if(a==='pay'){const pending=pos.pay(1200,saveSale);render();if(await pending){notify('Payment successful — receipt saved');render(true);}else{notify(pos.error);render();}}
 else if(a==='new'){pos.reset();category='All';notify('New transaction started — previous order cleared');render(true);}
 else if(a==='print')window.print();
});
render();
