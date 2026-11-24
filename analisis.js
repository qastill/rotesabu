/* Analisis bersama portal + infografis. Semua angka dihitung dari window.DATA (data.js).
   Konvensi jam: indeks h = 0..23 adalah catatan pukul (h+1).00, sama seperti logsheet PLN. */
(function(){
const D=window.DATA,SUS=300; // Ndao: nilai > 300 kW dianggap salah ketik (DMP 280 kW)

/* ---------- statistik satu grid 24 × ndays ---------- */
function stats(grid,n,sus=Infinity){let peak=0,pw=[0,0];const sus_=[],avg=[],mn=[],mx=[];let zeros=0;
 for(let h=0;h<24;h++){let s=0,c=0,lo=Infinity,hi=0;for(let d=0;d<n;d++){const v=grid[h][d];if(v>sus){sus_.push([h,d,v]);continue}if(v===0){zeros++;continue}s+=v;c++;lo=Math.min(lo,v);hi=Math.max(hi,v);if(v>peak){peak=v;pw=[h,d]}}avg.push(c?s/c:0);mn.push(c?lo:0);mx.push(hi)}
 const daily=[];for(let d=0;d<n;d++){let s=0,z=0;for(let h=0;h<24;h++){const v=grid[h][d];if(v>sus)continue;if(v===0)z++;s+=v}daily.push({e:s,z})}
 const full=daily.filter(x=>x.z===0&&x.e>0),E=(full.length?full:daily.filter(x=>x.e>0)).reduce((a,x)=>a+x.e,0)/Math.max(1,(full.length?full:daily.filter(x=>x.e>0)).length);
 const mean=(a,i,j)=>a.slice(i,j).reduce((x,y)=>x+y,0)/(j-i);
 const day=mean(avg,9,16),night=mean(avg,18,22),base=Math.min(...avg.filter(v=>v>0));
 // gangguan: nilai > 0 tetapi < 80% median jam yang sama (padam sebagian / pelepasan beban)
 const med=Array.from({length:24},(_,h)=>{const a=grid[h].slice(0,n).filter(v=>v>0&&v<=sus).sort((x,y)=>x-y);return a.length?a[a.length>>1]:0});
 const dips=[];for(let h=0;h<24;h++)for(let d=0;d<n;d++){const v=grid[h][d];if(v>0&&v<=sus&&v<.8*med[h])dips.push([h,d,v,med[h]])}
 const isDip=(h,d)=>{const v=grid[h][d];return v<.8*med[h]};
 const dayMin=Math.min(...[8,9,10,11,12,13,14].flatMap(h=>grid[h].slice(0,n).map((v,d)=>v>0&&v<=sus&&!isDip(h,d)?v:Infinity))); // beban siang terendah 09–15 di luar padam/gangguan
 const share917=avg.slice(8,17).reduce((a,b)=>a+b,0)/avg.reduce((a,b)=>a+b,0);
 return {med,dips,peak,pw,sus:sus_,avg,mn,mx,energy:E,daily,day,night,base,dayMin,share917,lf:peak?E/24/peak:0,zeros,hours:24*n,ratio:day?night/day:0}}

/* ---------- langgam penuh tiap sistem ---------- */
const LG=D.lg; // rote (Sep), sabu/raijua/semau (Okt)
const lgStats={};for(const k in LG)lgStats[k]=stats(LG[k].tot,LG[k].ndays);
const ndStats=D.ndao.map(m=>stats(m.grid,m.ndays,SUS));
// rata-rata Ndao 10 bulan sebagai satu "sistem" untuk perbandingan
const ndAll=(()=>{const avg=Array(24).fill(0);ndStats.forEach(s=>s.avg.forEach((v,h)=>avg[h]+=v/ndStats.length));const pk=ndStats.reduce((b,s,i)=>s.peak>ndStats[b].peak?i:b,0);
 return {avg,peak:ndStats[pk].peak,pkM:pk,energy:ndStats.reduce((a,s)=>a+s.energy,0)/ndStats.length,day:avg.slice(9,16).reduce((a,b)=>a+b,0)/7,night:avg.slice(18,22).reduce((a,b)=>a+b,0)/4,
  zeros:ndStats.reduce((a,s)=>a+s.zeros,0),hours:D.ndao.reduce((a,m)=>a+24*m.ndays,0),dayMin:Math.min(...ndStats.map(s=>s.dayMin)),lf:ndStats.reduce((a,s)=>a+s.lf,0)/ndStats.length}})();

/* ---------- bauran pasokan per kelompok unit ---------- */
function mix(k){const L=LG[k];if(!L.units)return null;const n=L.ndays,G={pln:0,sewa:0,pv:0},hour={pln:Array(24).fill(0),sewa:Array(24).fill(0),pv:Array(24).fill(0)};let tot=0;
 const units=L.units.map(u=>{if(!u.grid)return {...u,e:0,hrs:0,max:0,days:0};let e=0,hrs=0,max=0,days=0;
  for(let d=0;d<n;d++){let on=false;for(let h=0;h<24;h++){const v=u.grid[h][d];if(v>0){e+=v;hrs++;on=true;max=Math.max(max,v);hour[u.g][h]+=v/n}}if(on)days++}
  G[u.g]+=e;tot+=e;return {...u,e,hrs,max,days}});
 return {G,tot,hour,units,share:{pln:G.pln/tot,sewa:G.sewa/tot,pv:G.pv/tot}}}
const MIX={};for(const k in LG)MIX[k]=mix(k);

/* PLTS yang ada: yield & tanda pembatasan */
function pvInfo(k,kwp){const m=MIX[k];if(!m)return null;const u=m.units.find(x=>x.g==='pv');if(!u||!u.grid)return null;const n=LG[k].ndays,T=LG[k].tot;
 let rep={},top=0,topV=0,mxShare=0;for(let h=0;h<24;h++)for(let d=0;d<n;d++){const v=u.grid[h][d];if(v>0){rep[v]=(rep[v]||0)+1;if(rep[v]>top){top=rep[v];topV=v}if(T[h][d]>0)mxShare=Math.max(mxShare,v/T[h][d])}}
 let mid=0,midT=0;for(let h=9;h<14;h++)for(let d=0;d<n;d++){mid+=u.grid[h][d];midT+=T[h][d]}
 return {kwp,e:u.e/n,yld:u.e/n/kwp,max:u.max,top:topV,topN:top,mxShare,midShare:mid/midT,unit:u}}
const PVK={rote:180,ndao:0,sabu:1400,raijua:150,semau:450}; // kWp tersambung (SLD/info PLN; Raijua & Semau = DT inverter di logsheet)
const PV={sabu:pvInfo('sabu',PVK.sabu),raijua:pvInfo('raijua',PVK.raijua),semau:pvInfo('semau',PVK.semau)};

/* bentuk kurva PLTS: rata-rata per jam PLTS Eilode (Sabu) Okt 2026, dinormalisasi jumlah = 1 */
const SHAPE=(()=>{const g=PV.sabu.unit.grid,n=LG.sabu.ndays,a=Array.from({length:24},(_,h)=>g[h].slice(0,n).reduce((x,y)=>x+y,0)/n),s=a.reduce((x,y)=>x+y,0);return a.map(v=>v/s)})();

/* ---------- deret beban untuk simulasi (jam padam & anomali diisi rata-rata jam bulan itu) ---------- */
function series(k){const out=[];
 const push=(grid,n,sus)=>{const st=stats(grid,n,sus);for(let d=0;d<n;d++)for(let h=0;h<24;h++){const v=grid[h][d];out.push(v>0&&v<=sus?v:st.avg[h])}};
 if(k==='ndao')D.ndao.forEach(m=>push(m.grid,m.ndays,SUS));else push(LG[k].tot,LG[k].ndays,Infinity);return out}
const SER={};['rote','ndao','sabu','raijua','semau'].forEach(k=>SER[k]=series(k));

/* ---------- simulator jam-per-jam: PLTS + BESS + diesel ----------
 o.pv kWp, o.yld kWh/kWp/hari, o.bess kWh, o.bkw kW, o.dmin = beban minimum diesel saat menyala (fraksi beban),
 o.eff efisiensi bolak-balik, o.smin SOC minimum, o.clip batas keluaran PLTS (kW) bila ada. Tanpa BESS diesel selalu menyala (pembentuk jaringan).
 Dengan BESS grid-forming diesel boleh mati bila baterai sanggup memikul seluruh sisa beban jam itu. */
function simulate(load,o){const ef=Math.sqrt(o.eff??.9),smin=o.smin??.1,dmin=o.dmin??.5,B=o.bess||0,BK=B?(o.bkw||B/3):0,yl=o.yld??4.8;
 let soc=B*.5,T={load:0,pv:0,used:0,curt:0,dsl:0,dis:0,ch:0,off:0,n:load.length,dslMax:0};const prof=Array.from({length:24},()=>({dsl:0,pv:0,dis:0,ch:0,curt:0,load:0}));
 for(let i=0;i<load.length;i++){const h=i%24,L=load[i],P=Math.min(o.pv*yl*SHAPE[h],o.clip??Infinity);let D=0,use=0,dis=0,ch=0,curt=0;
  if(!B){D=Math.max(L-P,dmin*L);use=L-D;curt=P-use}
  else{const net=L-P;
   if(net<=0){use=L;const s=-net;ch=Math.min(s,BK,(B-soc)/ef);soc+=ch*ef;curt=s-ch}
   else{const avail=Math.min(BK,Math.max(0,(soc-B*smin)*ef));
    if(avail>=net){dis=net;soc-=dis/ef;use=P}
    else{D=Math.max(dmin*L,net-avail);dis=Math.max(0,net-D);soc-=dis/ef;use=L-D-dis;const ex=P-use;ch=Math.min(ex,BK,(B-soc)/ef);soc+=ch*ef;curt=ex-ch}}}
  if(D===0)T.off++;T.load+=L;T.pv+=P;T.used+=use;T.curt+=curt;T.dsl+=D;T.dis+=dis;T.ch+=ch;T.dslMax=Math.max(T.dslMax,D);
  const p=prof[h];p.dsl+=D;p.pv+=use;p.dis+=dis;p.ch+=ch;p.curt+=curt;p.load+=L}
 const days=load.length/24;prof.forEach(p=>{for(const k in p)p[k]/=days});
 const re=(T.used+T.dis)/T.load;return {...T,days,re,curtPct:T.pv?T.curt/T.pv:0,offH:T.off/days,prof,yr:x=>x*365/days}}

/* kondisi sekarang dengan asumsi yang sama: PLTS tersambung, tanpa BESS. Semau dan Raijua memakai batas keluaran yang tercatat */
const BASE={rote:{pv:180},ndao:{pv:0},sabu:{pv:1400},raijua:{pv:150,clip:80},semau:{pv:450,clip:100}};
/* kapasitas serap PLTS tanpa baterai: kWp terbesar dengan energi terbuang <= lim */
function hosting(k,o={},lim=.05){let lo=0,hi=Math.max(...SER[k])*4;for(let i=0;i<30;i++){const m=(lo+hi)/2,s=simulate(SER[k],{...o,pv:m,bess:0});if(s.curtPct<=lim)lo=m;else hi=m}return lo}

/* skenario acuan per sistem: [kode, nama, kWp, kWh, kW] — angka bulat untuk bahan diskusi, bukan hasil optimasi */
const SCEN={
 rote:[['S1','Tanpa baterai',5000,0,0],['S2','Menengah',10000,20000,5000],['S3','Porsi tinggi',18000,50000,8000]],
 ndao:[['S1','Hemat BBM',100,0,0],['S2','Menengah',300,600,200],['S3','Porsi tinggi',600,1500,300]],
 sabu:[['S1','Tambah 1 MWp',2400,0,0],['S2','Eilode + BESS',5000,10000,3000],['S3','Porsi tinggi',9000,25000,5000]],
 raijua:[['S1','Baterai dulu',150,300,150],['S2','Menengah',400,600,250],['S3','Porsi tinggi',1000,3000,400]],
 semau:[['S1','Buka batas 100 kW',450,0,0],['S2','Menengah',1200,2500,700],['S3','Porsi tinggi',2500,7000,1000]]};

window.AN={BASE,hosting,SUS,stats,LG,lgStats,ndStats,ndAll,MIX,PV,PVK,SHAPE,SER,simulate,SCEN,series};
})();
