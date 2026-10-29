// Demonstration ledger. Production must run the same invariants in database transactions.
export const SCALE=1_000_000;
export function quote(amount,rate,bps=1000){
 if(!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(rate)||rate<=0||!Number.isInteger(bps)||bps<0||bps>=10000)throw Error('Некорректная сумма или курс');
 const n=BigInt(amount)*BigInt(10000-bps)*1000000n,d=10000n*BigInt(rate);
 const units=Number((n+d/2n)/d);if(!Number.isSafeInteger(units))throw Error('Сумма слишком велика');return units;
}
export const reserved=s=>s.orders.filter(o=>o.status==='pending').reduce((a,o)=>a+o.units,0);
export const available=s=>s.deposit-reserved(s);
export const withdrawReserved=s=>s.withdrawals.filter(w=>w.status==='pending').reduce((a,w)=>a+w.units,0);
export function expire(s,now=Date.now()){s.orders.forEach(o=>{if(o.status==='pending'&&o.expires<=now){o.status='expired';o.history.push({at:now,text:'Срок оплаты истёк; резерв освобождён'});}});}
export function createOrder(s,amount,now=Date.now()){
 expire(s,now);const req=s.requisites.find(r=>r.active);if(!req)throw Error('Нет включённых реквизитов');
 const units=quote(amount,s.rate);if(units>available(s))throw Error('Недостаточно рабочего депозита');
 const o={id:crypto.randomUUID(),external:'DEMO-'+String(s.orders.length+1).padStart(4,'0'),amount,rate:s.rate,units,status:'pending',created:now,expires:now+25*60000,requisite:{...req},receipt:false,history:[{at:now,text:'Заявка создана, реквизиты выданы, USDT зарезервированы'}]};s.orders.unshift(o);return o;
}
export function decide(s,id,action,now=Date.now()){
 expire(s,now);const o=s.orders.find(o=>o.id===id);if(!o)throw Error('Заявка не найдена');
 if(o.status==='confirmed')throw Error('Заявка уже подтверждена');
 if(action==='confirm'){
  if(o.status!=='pending'&&o.status!=='expired')throw Error('Недопустимый статус');
  if(o.units>available(s)+(o.status==='pending'?o.units:0))throw Error('Недостаточно депозита для позднего подтверждения');
  s.deposit-=o.units;s.payable+=o.units;s.commissionKzt+=o.amount*0.1;o.status='confirmed';o.decided=now;
  o.history.push({at:now,text:'Демо-оператор подтвердил оплату; депозит списан один раз'});
 }else if(action==='reject'&&o.status==='pending'){o.status='expired';o.reason='rejected';o.history.push({at:now,text:'Отклонено оператором; резерв освобождён'});}else throw Error('Действие недоступно');
}
export function requestWithdrawal(s,units,wallet){
 if(!Number.isSafeInteger(units)||units<=0||units>s.payable-withdrawReserved(s))throw Error('Недопустимая сумма вывода');
 if(!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(wallet))throw Error('Укажите адрес TRON из 34 символов');
 const w={id:crypto.randomUUID(),units,wallet,status:'pending',created:Date.now()};s.withdrawals.unshift(w);return w;
}
export function completeWithdrawal(s,id,tx){
 const w=s.withdrawals.find(w=>w.id===id);if(!w||w.status!=='pending')throw Error('Заявка уже обработана');
 if(!/^[0-9a-f]{64}$/i.test(tx))throw Error('Хеш транзакции должен содержать 64 шестнадцатеричных символа');
 if(s.withdrawals.some(w=>w.tx===tx.toLowerCase()))throw Error('Этот хеш уже использован');
 s.payable-=w.units;w.status='completed';w.tx=tx.toLowerCase();
}
export function seed(){
 const s={version:1,deposit:850*SCALE,payable:0,commissionKzt:0,rate:485,orders:[],withdrawals:[],topups:[{at:Date.now(),units:850*SCALE}],requisites:[{id:'r1',name:'Kaspi • основной',bank:'Kaspi Bank',details:'ДЕМО •••• 0001',owner:'Тестовый получатель',active:true},{id:'r2',name:'Halyk • резервный',bank:'Halyk Bank',details:'ДЕМО •••• 0002',owner:'Тестовый получатель',active:false}]};
 const now=Date.now();for(let i=6;i>=1;i--){const at=now-i*86400000,o=createOrder(s,[20000,9700,15000,25000,12500,18000][i-1],at);decide(s,o.id,'confirm',at+300000);}
 createOrder(s,20000,now-5*60000);createOrder(s,9700,now-60000);return s;
}
