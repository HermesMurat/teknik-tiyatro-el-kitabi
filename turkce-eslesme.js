/* Türkçe ek ve bağlam genişletici · Mevzuat RAG v2.1 */
(()=>{
'use strict';
const baseAnswer=window.answer;
if(typeof baseAnswer!=='function')return;
const norm=s=>String(s??'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,' ').trim();
const suffixes=['larinizdan','lerinizden','larindan','lerinden','siniz','siniz','sunuz','sunuz','abilir','ebilir','acaktir','ecektir','iyorsunuz','iyorsunuz','uyor','uyor','iyor','iyor','misiniz','misiniz','siyla','siyle','lariyla','leriyle','sinda','sinde','sundan','sunden','sinin','sinin','sini','sini','sunu','sunu','lardan','lerden','larda','lerde','lar','ler','daki','deki','dan','den','tan','ten','yla','yle','nin','nin','nun','nun','miz','miz','muz','muz','niz','niz','nuz','nuz','lik','lik','luk','luk','li','li','lu','lu','acak','ecek','iyor','iyor','uyor','uyor','mis','mis','mus','mus','mak','mek','ma','me','da','de','ta','te','ya','ye','yi','yi','yu','yu','si','si','su','su'];
function stem(w){let x=w;if(x.length<5)return x;for(let i=0;i<2;i++){const s=suffixes.find(z=>x.endsWith(z)&&x.length-z.length>=4);if(!s)break;x=x.slice(0,-s.length)}return x}
function expand(q){const n=norm(q),tokens=n.split(/\s+/).filter(Boolean),stems=[...new Set(tokens.map(stem).filter(x=>x.length>=4))],h=[];
if(/video|foto|fotograf|kamera|goruntu|kayit|sosyal medya|paylas/.test(n))h.push('kişisel veri kvkk aydınlatma açık rıza telif eser çoğaltma yayın kayıt paylaşım sosyal medya');
if(/motor|vinc|ceraskal|caraskal|truss|kaldir|platform|periyodik|muayene|kontrol/.test(n))h.push('iş ekipmanı periyodik kontrol bakım yetkili kişi iş güvenliği risk');
if(/acil cikis|kacis|yangin|duman|alev|sprinkler|detektor|dekor/.test(n))h.push('yangın kaçış acil çıkış tahliye bina güvenliği');
if(/satin al|ihale|dogrudan temin|sartname|yaklasik maliyet|muayene kabul|yuklenici/.test(n))h.push('kamu alımı ihale teknik şartname yaklaşık maliyet sözleşme kabul');
if(/engelli|tekerlekli|rampa|altyazi|sesli betimleme|erisilebilir/.test(n))h.push('erişilebilirlik eşit katılım kişisel tahliye umuma açık yapı');
if(/gorev|yetki|sanat teknik|teknik mudur|basrealizator|kondüvit|kondüvit/.test(n))h.push('devlet tiyatroları görev çalışma yönergesi yetki sorumluluk');
return [q,...stems,...h].join(' ')}
window.answer=async function(q){await baseAnswer(expand(q));const users=document.querySelectorAll?.('#messages .msg.user');if(users?.length)users[users.length-1].textContent=q};
})();
