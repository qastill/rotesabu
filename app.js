{
const D=window.DATA,A=window.AN,LS=A.lgStats,MX=A.MIX,NR=D.neraca.rote,SUS=A.SUS;
const $=s=>document.querySelector(s);
const f=(v,d=0)=>Number(v).toLocaleString('id-ID',{maximumFractionDigits:d,minimumFractionDigits:d});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pc=(v,d=0)=>f(v*100,d)+'%';
const HOUR=i=>String(i+1).padStart(2,'0')+'.00';
const VIEWS=[['ringkasan','Ringkasan'],['insight','Insight'],['sistem','Sistem'],['beban','Langgam beban'],['simulator','Simulator PLTS + BESS'],['sld','SLD'],['sumber','Sumber data']];
const XLS=location.hostname.endsWith('claude.ai')?'https://github.com/qastill/rotesabu/raw/main/data/':'data/'; // Excel tidak bisa dihosting di artifact, ambil dari GitHub
function ticks(mx,n=5){const raw=mx/n,p=10**Math.floor(Math.log10(raw||1)),st=[1,2,2.5,5,10].map(x=>x*p).find(x=>x>=raw);const t=[];for(let v=0;v<=mx+1e-9;v+=st)t.push(v);return t}

/* ---------- angka turunan ---------- */
const cap=k=>{const r=D.mesin[k],t=r.reduce((a,x)=>a+x.dmp,0),mx=Math.max(...r.map(x=>x.dmp));return {dmp:t,n1:t-mx,mx,dt:r.reduce((a,x)=>a+x.dt,0),n:r.length}};
const C={ndao:cap('ndao'),raijua:cap('raijua'),seba:cap('seba')};
const smDiesel=D.lg.semau.units.filter(u=>u.g==='pln'),C_SM={dmp:smDiesel.reduce((a,u)=>a+u.dmp,0),mx:Math.max(...smDiesel.map(u=>u.dmp)),dt:smDiesel.reduce((a,u)=>a+u.dt,0),n:smDiesel.length};C_SM.n1=C_SM.dmp-C_SM.mx;
const sewaSabu=MX.sabu.units.find(u=>u.g==='sewa'),pvSabu=MX.sabu.units.find(u=>u.g==='pv');
const plnRote=NR.units.filter(u=>!/sewa/i.test(u.lok)).reduce((a,u)=>a+u.dm,0),sewaRote=NR.dm-plnRote;
const N=A.ndAll,R=LS.rote,S=LS.sabu,RJ=LS.raijua,SM=LS.semau;
const HC={};const hc=k=>HC[k]??=A.hosting(k);
const rjSep=D.raijua.reduce((b,m)=>m.peak>b.peak?m:b,D.raijua[0]);

/* ---------- fakta sistem ---------- */
const SYS=[
 {k:'rote',n:'Rote',proj:'Rote Ndao · RFP 1773',role:'Sistem besar · 20 kV',pln:plnRote,sewa:sewaRote,cap:NR.dm,peak:R.peak,dt:null,mx:570,my:250,cx:72,cy:72,
  facts:[['Pembangkit',`PLTD sewa Bima Golden Powerindo (BGP) ${f(sewaRote)} kW + PLTD Ba'a milik PLN ${f(plnRote)} kW (Komatsu 650 kW 2024, Cummins 1.000 kW 2025)`],
   ['Beban puncak',`${f(R.peak)} kW (${R.pw[1]+1} Sep 2026, ${HOUR(R.pw[0])}, logsheet) · label SLD 8.500 kW terkonfirmasi`],
   ['Energi',`±${f(R.energy)} kWh/hari (Sep 2026) · ±${f(R.energy*365/1e6,1)} GWh/tahun`],
   ['Neraca daya',`daya mampu ${f(NR.dm)} kW · cadangan operasi ${f(Math.min(...NR.cadOp))}–${f(Math.max(...NR.cadOp))} kW · status ${NR.status} sepanjang September`],
   ['PLTS tersambung','Usulandu 70 kWp (puncak 9,4 kW) · Landuthi 110 kWp (puncak 15,3 kW)'],
   ['Jaringan','±300 gardu distribusi (kode BL, BT, LK, LL, NB, PB, RM, RS, RT) · ±304 trafo, ±19,5 MVA · GH Onatali dan GH Ba\'a'],
   ['Sumber','Neraca daya & LF Rote Sep 2026 (ULPL Kupang) · SLD ULP Rote Ndao 12 Jun 2026']],
  warn:`${pc(sewaRote/NR.dm)} daya mampu Rote adalah pembangkit sewa. Tanpa BGP, PLTD milik PLN (${f(plnRote)} kW) hanya menutup ${pc(plnRote/R.peak)} beban puncak.`},
 {k:'ndao',n:'Ndao',proj:'Rote Ndao · RFP 1773',role:'Pulau kecil · 1 penyulang',cap:280,peak:N.peak,dt:731,mx:414,my:291,cx:46,cy:88,mesin:'ndao',
  facts:[['Pembangkit','PLTD Ndao, 5 mesin · terpasang 731 kW · DMP 280 kW (SLD mencatat daya mampu 310 kW)'],['Beban puncak',`${f(N.peak)} kW (${D.ndao[N.pkM].m} 2026, logsheet) · SLD mencatat 188 kW`],['Energi',`±${f(N.energy)} kWh/hari dari langgam Jan–Okt 2026`],['Jaringan','1 penyulang dari PLTD · 4 gardu × 50 kVA (ND 001–004)'],['Lahan PLTS','Sudah tersedia (info PLN)']],
  warn:`Cadangan daya hanya ±${f(280-N.peak)} kW di atas beban puncak. Beban siang (±${f(N.day)} kW) jauh di bawah beban malam (±${f(N.night)} kW), sehingga PLTS tanpa baterai hanya menggantikan sebagian kecil BBM.`},
 {k:'sabu',n:'Sabu',proj:'Sabu Raijua · RFP 1772',role:'Sistem besar · 5 penyulang',pln:C.seba.dmp,sewa:sewaSabu.max,cap:C.seba.dmp+sewaSabu.max,peak:S.peak,dt:7780,mx:174,my:204,cx:21,cy:33,mesin:'seba',
  facts:[['Beban puncak',`${f(S.peak)} kW (${S.pw[1]+1} Okt 2026, ${HOUR(S.pw[0])}, logsheet) · catatan rapat sebelumnya ±4.200 kW`],
   ['Energi',`±${f(S.energy)} kWh/hari (Okt 2026) · ±${f(S.energy*365/1e6,1)} GWh/tahun`],
   ['Bauran Okt 2026',`${pc(MX.sabu.share.sewa)} diesel sewa SPI · ${pc(MX.sabu.share.pv)} PLTS sewa Eilode · ${pc(MX.sabu.share.pln)} PLTD milik PLN`],
   ['Pola operasi','Pukul 10.00–16.00 mesin PLN mati sepenuhnya; siang hari dipikul hybrid sewa SPI. Mesin PLN masuk pukul 18.00–07.00'],
   ['PLTD Seba (PLN)',`13 mesin · terpasang 7.780 kW · DMP ${f(C.seba.dmp)} kW · hanya ${MX.sabu.units.filter(u=>u.g==='pln'&&u.e>0).length} mesin menyala di Oktober`],
   ['Hybrid Eilode (sewa SPI)',`diesel sewa sampai ${f(sewaSabu.max)} kW + PLTS 1,4 MWp tanpa baterai (keluaran tertinggi ${f(pvSabu.max)} kW)`],
   ['Penyulang','Mesara · Seba · Menia · Liae · Bolou, bus 20,04 kV'],['Jaringan','±126 gardu (SB, ST, HM, LA) · 50–250 kVA · ±9,3 MVA'],['Sumber','Langgam beban Okt 2026 (per unit) · SLD Sistem Sabu Okt 2026']],
  warn:`${pc(MX.sabu.share.sewa+MX.sabu.share.pv)} energi Sabu dibeli dari pembangkit sewa. Tanpa SPI, DMP PLTD Seba (${f(C.seba.dmp)} kW) kurang ${f(S.peak-C.seba.dmp)} kW dari puncak. Lembar sumber mencatat DT/DMP sewa 1.500 kW padahal keluarannya sampai ${f(sewaSabu.max)} kW.`},
 {k:'raijua',n:'Raijua',proj:'Sabu Raijua',role:'Pulau kecil · 1 penyulang',out:'Di luar lingkup RFP 1772',cap:490,peak:rjSep.peak,n1:340,dt:980,mx:90,my:231,cx:12,cy:76,mesin:'raijua',
  facts:[['Pembangkit','PLTD Raijua · data mesin: 6 mesin, terpasang 980 kW, DMP 490 kW · logsheet Okt mencatat 8 mesin diesel'],['Beban puncak',`${f(rjSep.peak)} kW (17 Sep 2026, 19.00) · Okt ${f(RJ.peak)} kW`],['Energi',`±${f(RJ.energy)} kWh/hari pada hari tanpa padam (Okt 2026)`],['Keandalan',`${RJ.zeros} jam padam total di Oktober (${pc(RJ.zeros/RJ.hours,1)} waktu)`],['PLTS + baterai',`SMA STP 25000TL-30, inverter ${A.PVK.raijua} kW · keluaran tertinggi ${f(A.PV.raijua.max)} kW · ${f(A.PV.raijua.e)} kWh/hari (${pc(MX.raijua.share.pv)} energi Okt)`],['Jaringan','1 penyulang radial P. Raijua · 7 gardu (RJ 001–007) · ±500 kVA'],['Lingkup RFP','RFP 1772 hanya mencakup Pulau Sabu; Raijua dapat diusulkan sebagai site tambahan saat inception']],
  warn:'Jika mesin terbesar (MAN 150 kW DMP) lepas, sisa 340 kW berada di bawah beban puncak 351 kW. Siang hari beban turun ke ±150 kW.'},
 {k:'semau',n:'Semau',proj:'Kupang',role:'Pulau kecil dekat Kupang',out:'Data tambahan · di luar RFP',cap:C_SM.dmp,peak:SM.peak,n1:C_SM.n1,dt:C_SM.dt,mx:624,my:111,cx:62,cy:23,
  facts:[['Pembangkit',`PLTD Semau, ${C_SM.n} mesin (Volvo, Deutz, 3 × MTU 12V2000) · terpasang ${f(C_SM.dt)} kW · DMP ${f(C_SM.dmp)} kW`],['Beban puncak',`${f(SM.peak)} kW (${SM.pw[1]+1} Okt 2026, ${HOUR(SM.pw[0])})`],['Energi',`±${f(SM.energy)} kWh/hari (Okt 2026)`],['PLTS on-grid',`inverter ${A.PVK.semau} kW, tetapi keluaran tertahan rata di ${f(A.PV.semau.top)} kW selama ${A.PV.semau.topN} jam · ${pc(MX.semau.share.pv)} energi Okt`],['Sumber','Langgam beban Okt 2026, lembar SEMAU']],
  warn:`PLTS Semau berproduksi ${f(A.PV.semau.yld,1)} kWh/kW/hari, kurang dari separuh PLTS Eilode (${f(A.PV.sabu.yld,1)}). Batas ${f(A.PV.semau.top)} kW kemungkinan setelan pembatas daya atau inverter yang tidak tersedia; perlu dicek ke ULP.`}];
const SYSK=Object.fromEntries(SYS.map(s=>[s.k,s]));
const SLDS=[
 {k:'rote',t:'Single Line ULP Rote Ndao',sub:'Sistem Rote dan PLTD Ndao · 12 Juni 2026 · PLN UP3 Kupang',img:'assets/sld-rote.png',w:2742,h:2104,pdf:'data/SLD-Rote-Ndao-Jun-2026.pdf',
  pts:['Beban puncak sistem Rote 8.500 kW di SLD; logsheet September mencatat 8.507 kW','PLTD BGP (sewa) masuk lewat GH Onatali; GH Ba\'a membagi penyulang ke arah barat dan tengah pulau','PLTS Usulandu 70 kWp (timur laut) dan PLTS Landuthi 110 kWp (selatan) tersambung ke 20 kV','PLTD Ndao di pojok kiri atas: daya mampu 310 kW, beban puncak 188 kW, 4 gardu 50 kVA']},
 {k:'sabu',t:'Single Line Diagram Sistem Sabu',sub:'Oktober 2026 · ULP Sabu Raijua',img:'assets/sld-sabu.png',w:2228,h:1403,pdf:'data/SLD-Sabu-Raijua-Okt-2026.pdf',
  pts:['PLTD Seba (11 unit PLN di SLD, 13 mesin di data mesin) memasok P. Mesara, P. Seba, P. Menia dan P. Liae','Hybrid Eilode: 6 unit diesel sewa + 1 unit PLTS masuk lewat express berbeban ke P. Menia dan P. Bolou','LBS dan recloser (Natuga, Eimadawadu, Ledemanu, Eimadake, Bolou) membagi seksi penyulang','PLTS Raerobo tersambung di ujung P. Liae lewat FCO']},
 {k:'raijua',t:'Single Line Diagram Sistem Raijua',sub:'Oktober 2026 · ULP Sabu Raijua',img:'assets/sld-raijua.png',w:1545,h:934,pdf:'data/SLD-Sabu-Raijua-Okt-2026.pdf',
  pts:['Satu penyulang radial P. Raijua dari PLTD Raijua','7 gardu: Kolorae, Ballu, Ledeke, Ledeunu, Bolua, RSUD Raijua dan satu gardu cantol','FCO Kolorae, Ledeke, Bolua, Ledeunu, ACO dan Telkomsel sebagai pengaman seksi']}];

/* ---------- util ---------- */
const sel={ndao:3,raijua:4,sld:0,sys:'rote',lg:'rote'};
const SIM={k:'ndao',pv:300,bess:600,bkw:200,yld:4.8,dmin:50,sfc:.28};
function tipInit(wrap){const t=document.createElement('div');t.className='tip';wrap.appendChild(t);return t}
function showTip(t,wrap,x,y,html){const r=wrap.getBoundingClientRect();t.innerHTML=html;t.style.left=(x-r.left)+'px';t.style.top=(y-r.top)+'px';t.classList.add('on')}
function hideTip(t){t.classList.remove('on')}
const CURV={};let curvN=0;
const GRP={pln:['PLTD milik PLN','--s1'],sewa:['Diesel sewa','--s2'],pv:['PLTS','--s4']};

/* ---------- peta ---------- */
function mapSvg(){const r1='M682,98 L640,128 Q600,170 528,258',r2='M682,98 L640,128 Q420,110 162,190';
 return `<svg viewBox="0 0 840 390" aria-hidden="true">
 ${[[230,90],[330,300],[470,150],[700,250],[120,320],[590,340]].map(([x,y])=>`<path class="wave" d="M${x},${y}q10,-8 20,0t20,0"/>`).join('')}
 <g transform="translate(62,58)"><g class="rays" stroke="var(--sun)" stroke-width="5" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>`<path d="M0,-34V-46" transform="rotate(${a})"/>`).join('')}</g><circle r="24" fill="var(--sun)"/></g>
 <polygon class="timor" points="900,-120 795,0 726,39 690,51 726,75 684,96 654,120 648,147 690,153 750,135 900,80"/>
 <path class="route" d="${r1}"/><path class="route" d="${r2}"/><path class="route s" d="M528,258 Q470,262 418,288"/><path class="route s" d="M159,192 Q120,196 94,226"/><path class="route s" d="M682,98 Q650,100 632,108"/>
 <polygon class="land" points="636,180 615,186 590,205 560,225 535,243 505,275 480,295 462,312 465,326 485,330 510,318 540,300 570,280 600,255 625,225 640,198"/>
 <ellipse class="land" cx="414" cy="291" rx="7" ry="5"/><ellipse class="land" cx="624" cy="111" rx="9" ry="15"/>
 <ellipse class="land" cx="174" cy="204" rx="40" ry="19" transform="rotate(-14 174 204)"/><ellipse class="land" cx="90" cy="231" rx="12" ry="7"/>
 <circle cx="684" cy="96" r="6" fill="#fff"/><circle cx="528" cy="258" r="4" fill="var(--sea2)"/><circle cx="159" cy="192" r="4" fill="var(--sea2)"/>
 ${SYS.map(s=>`<circle class="pulse" cx="${s.mx}" cy="${s.my}" r="9"/>`).join('')}
 <path d="M670,368h137M670,362v12M807,362v12" stroke="#fff" stroke-width="2" opacity=".7" fill="none"/></svg>`}

/* ---------- grafik umum ---------- */
const T=(v,u,l)=>`<div class="tile"><b>${v}${u?`<small> ${u}</small>`:''}</b><span>${l}</span></div>`;
function curve(label,s){const id='c'+(++curvN),W=680,H=250,L=46,R=12,Tp=14,B=30,mx=Math.max(...s.mx,1)*1.1,x=h=>L+h/23*(W-L-R),y=v=>Tp+(H-Tp-B)-v/mx*(H-Tp-B);
 CURV[id]={s,mx};const tk=ticks(mx),pts=a=>a.map((v,h)=>`${x(h)},${y(v)}`).join(' ');
 const band=`M${s.mx.map((v,h)=>`${x(h)},${y(v)}`).join(' L')} L${[...s.mn].reverse().map((v,i)=>`${x(23-i)},${y(v)}`).join(' L')} Z`;
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Kurva beban harian rata-rata ${esc(label)}">
 ${tk.map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${f(t)}</text>`).join('')}
 <rect x="${x(5.5)}" y="${Tp}" width="${x(17.5)-x(5.5)}" height="${H-Tp-B}" fill="var(--sun)" opacity=".08"/>
 <path class="band" d="${band}" fill="var(--sea)"/><polyline class="ln" points="${pts(s.avg)}" stroke="var(--sea)"/>
 ${[0,6,12,18,23].map(h=>`<text x="${x(h)}" y="${H-10}" text-anchor="middle">${HOUR(h)}</text>`).join('')}
 <line class="ax" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/>
 <g class="cross" style="display:none"><line class="ax" y1="${Tp}" y2="${y(0)}" stroke="var(--ink)"/><circle r="4" fill="var(--sea)" stroke="var(--card)" stroke-width="2"/></g>
 <rect class="hit" x="${L}" y="${Tp}" width="${W-L-R}" height="${H-Tp-B}" data-curve-hit="${id}"/></svg>
 <div class="legend"><span><i class="l" style="background:var(--sea)"></i>Rata-rata per jam</span><span><i style="background:var(--sea);opacity:.25"></i>Rentang min–maks hari-hari dalam bulan</span><span><i style="background:var(--sun);opacity:.4"></i>jam matahari ±06–18</span></div></div>`}
function heat(grid,n,label,mx,sus=Infinity,lo=0){const W=680,L=40,Tp=18,cw=(W-L-8)/n,ch=9,H=Tp+24*ch+22,Q=['--q1','--q2','--q3','--q4','--q5','--q6','--q7'];
 const col=v=>v<=0?'var(--soft)':v>sus?'var(--warn)':`var(${Q[Math.max(0,Math.min(6,Math.floor((v-lo)/(mx-lo)*7)))]})`;
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Peta panas beban per jam per hari ${esc(label)}">
 ${[0,6,12,18,23].map(h=>`<text x="${L-6}" y="${Tp+h*ch+7}" text-anchor="end">${HOUR(h)}</text>`).join('')}
 ${Array.from({length:n},(_,d)=>(d%5===0||d===n-1)?`<text x="${L+d*cw+cw/2}" y="${H-6}" text-anchor="middle">${d+1}</text>`:'').join('')}
 ${grid.flatMap((row,h)=>row.slice(0,n).map((v,d)=>`<rect class="cell" x="${L+d*cw}" y="${Tp+h*ch}" width="${cw}" height="${ch}" fill="${col(v)}" data-tip="<b>Tgl ${d+1} · ${HOUR(h)}</b><br>${v>sus?'<span style=color:var(--sun)>'+f(v)+' kW, nilai anomali</span>':v?f(v)+' kW':'0 kW (padam / tidak tercatat)'}"/>`)).join('')}</svg>
 <div class="legend"><span>${lo?'≤ '+f(lo):'0'} kW<span class="ramp">${Q.map(c=>`<i style="background:var(${c})"></i>`).join('')}</span>${f(mx)}+ kW</span><span><i style="background:var(--soft)"></i>0 / padam</span>${sus<Infinity?`<span><i style="background:var(--warn)"></i>anomali &gt; ${sus} kW</span>`:''}</div></div>`}
function gridTable(grid,n,label,sus=Infinity){return `<details><summary>Tabel lengkap ${esc(label)} (24 jam × ${n} hari)</summary><div class="twrap" style="margin-top:8px"><table><thead><tr><th>Jam</th>${Array.from({length:n},(_,d)=>`<th class="r">${d+1}</th>`).join('')}<th class="r">Maks</th></tr></thead>
 <tbody>${grid.map((row,h)=>`<tr><td>${HOUR(h)}</td>${row.slice(0,n).map(v=>`<td class="r"${v>sus?' style="color:var(--warn);font-weight:700"':''}>${v?f(v):'·'}</td>`).join('')}<td class="r"><b>${f(Math.max(...row.slice(0,n)))}</b></td></tr>`).join('')}</tbody></table></div></details>`}
function dailyChart(grid,n,s,mon){const W=680,H=200,L=56,R=12,Tp=14,B=30,bw=(W-L-R)/n,E=s.daily.map(x=>x.e),mx=Math.max(...E)*1.12,y=v=>Tp+(H-Tp-B)-v/mx*(H-Tp-B),tk=ticks(mx,4);
 const dipD=new Set(s.dips.map(x=>x[1]));
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Energi harian">
 ${tk.map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${f(t/1000,t<10000?1:0)}k</text>`).join('')}
 ${s.daily.map((x,d)=>{const bad=x.z>0,dip=dipD.has(d),pk=Math.max(...grid.map(r=>r[d]));return `<rect x="${L+d*bw+1.5}" y="${y(x.e)}" width="${bw-3}" height="${y(0)-y(x.e)}" fill="${bad?'var(--warn)':dip?'var(--s4)':'var(--sea)'}" rx="2"/>
  ${(d%5===0||d===n-1)?`<text x="${L+d*bw+bw/2}" y="${H-10}" text-anchor="middle">${d+1}</text>`:''}
  <rect class="hit" x="${L+d*bw}" y="${Tp}" width="${bw}" height="${H-Tp-B}" data-tip="<b>${d+1} ${mon}</b><br>${f(x.e)} kWh · puncak ${f(pk)} kW${bad?'<br>'+x.z+' jam padam':''}${dip?'<br>ada jam dengan beban &lt; 80% median (gangguan)':''}"/>`}).join('')}
 <line class="ax" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/></svg>
 <div class="legend"><span><i style="background:var(--sea)"></i>Energi per hari (kWh)</span><span><i style="background:var(--s4)"></i>hari dengan gangguan</span><span><i style="background:var(--warn)"></i>hari dengan jam padam</span></div></div>`}
function mixChart(k){const m=MX[k],W=680,H=260,L=56,R=12,Tp=14,B=30,bw=(W-L-R)/24,gs=['pln','sewa','pv'].filter(g=>m.G[g]>0),tot=h=>gs.reduce((a,g)=>a+m.hour[g][h],0),mx=Math.max(...Array.from({length:24},(_,h)=>tot(h)))*1.1,y=v=>Tp+(H-Tp-B)-v/mx*(H-Tp-B),tk=ticks(mx);
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bauran pasokan rata-rata per jam">
 ${tk.map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${f(t)}</text>`).join('')}
 ${Array.from({length:24},(_,h)=>{let acc=0;const x=L+h*bw+2,w=bw-4;return gs.map(g=>{const v=m.hour[g][h];if(v<=0)return '';const y0=y(acc+v),hh=y(acc)-y0;acc+=v;return `<rect x="${x}" y="${y0+.5}" width="${w}" height="${Math.max(hh-1,.5)}" fill="var(${GRP[g][1]})" rx="2"/>`}).join('')+
  `${h%3===0?`<text x="${x+w/2}" y="${H-10}" text-anchor="middle">${HOUR(h)}</text>`:''}<rect class="hit" x="${L+h*bw}" y="${Tp}" width="${bw}" height="${H-Tp-B}" data-tip="<b>${HOUR(h)}</b> · total ${f(tot(h))} kW<br>${gs.map(g=>GRP[g][0]+' '+f(m.hour[g][h])+' kW ('+pc(m.hour[g][h]/tot(h))+')').join('<br>')}"/>`}).join('')}
 <line class="ax" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/></svg>
 <div class="legend">${gs.map(g=>`<span><i style="background:var(${GRP[g][1]})"></i>${GRP[g][0]} · ${pc(m.share[g])} energi</span>`).join('')}</div></div>`}
function unitTable(k){const m=MX[k],n=A.LG[k].ndays,us=[...m.units].sort((a,b)=>b.e-a.e);
 return `<div class="twrap"><table><thead><tr><th>Unit</th><th>Jenis</th><th class="r">DMP kW</th><th class="r">Energi kWh</th><th class="r">Porsi</th><th class="r">Jam nyala</th><th class="r">Hari</th><th class="r">Maks kW</th></tr></thead>
 <tbody>${us.map(u=>`<tr${u.e?'':' class="mute"'}><td>${esc(u.n)}</td><td><span class="dot" style="background:var(${GRP[u.g][1]})"></span>${GRP[u.g][0]}</td><td class="r">${f(u.dmp,1)}</td><td class="r">${u.e?f(u.e):'—'}</td><td class="r">${u.e?pc(u.e/m.tot,1):'—'}</td><td class="r">${u.hrs||'—'}</td><td class="r">${u.days||'—'}</td><td class="r"${u.max>u.dmp&&u.dmp?' style="color:var(--warn);font-weight:700"':''}>${u.max?f(u.max):'—'}</td></tr>`).join('')}</tbody>
 <tfoot><tr><td colspan="3">${m.units.filter(u=>u.e>0).length} dari ${m.units.length} unit beroperasi · ${n} hari</td><td class="r">${f(m.tot)}</td><td class="r">100%</td><td colspan="3"></td></tr></tfoot></table></div>
 <p class="small mute" style="margin-top:8px">DMP dari lembar logsheet. Merah = keluaran tertinggi melebihi DMP yang tercatat.</p>`}
function neracaChart(){const n=30,W=680,H=240,L=56,R=12,Tp=14,B=30,bw=(W-L-R)/n,mx=NR.dm*1.08,y=v=>Tp+(H-Tp-B)-v/mx*(H-Tp-B),tk=ticks(mx);
 const lines=[[NR.dm,'Daya mampu total','var(--ink)'],[NR.dm-NR.terbesar,'Daya mampu − unit terbesar','var(--mute)'],[plnRote,'Daya mampu PLN sendiri','var(--s1)']];
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Neraca daya harian Rote September 2026">
 ${tk.map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${f(t)}</text>`).join('')}
 ${NR.bpMalam.map((v,d)=>{const x=L+d*bw,w=bw*.4;return `<rect x="${x+bw*.08}" y="${y(v)}" width="${w}" height="${y(0)-y(v)}" fill="var(--acc)" rx="2"/><rect x="${x+bw*.1+w}" y="${y(NR.bpSiang[d])}" width="${w}" height="${y(0)-y(NR.bpSiang[d])}" fill="var(--sea)" rx="2"/>
  ${(d%5===0||d===n-1)?`<text x="${x+bw/2}" y="${H-10}" text-anchor="middle">${d+1}</text>`:''}
  <rect class="hit" x="${x}" y="${Tp}" width="${bw}" height="${H-Tp-B}" data-tip="<b>${d+1} September 2026</b><br>Puncak malam ${f(v)} kW · siang ${f(NR.bpSiang[d])} kW<br>Cadangan operasi ${f(NR.cadOp[d])} kW (${pc(NR.cadOp[d]/NR.dm)})<br>Cadangan pasti ${f(NR.cadPasti[d])} kW · ${NR.status}"/>`}).join('')}
 ${lines.map(([v,,c])=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="${c}" stroke-width="1.5" stroke-dasharray="5 4"/>`).join('')}
 <line class="ax" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/></svg>
 <div class="legend"><span><i style="background:var(--acc)"></i>Beban puncak malam</span><span><i style="background:var(--sea)"></i>Beban siang (10.00)</span>${lines.map(([v,l,c])=>`<span><i class="l" style="background:${c}"></i>${l} ${f(v)} kW</span>`).join('')}</div></div>`}
function shapeChart(){const W=680,H=250,L=46,Rm=12,Tp=14,B=30,x=h=>L+h/23*(W-L-Rm),y=v=>Tp+(H-Tp-B)-v*(H-Tp-B)/1.05;
 const sets=[['Rote',R.avg,'--s1'],['Ndao',N.avg,'--s2'],['Sabu',S.avg,'--s3'],['Raijua',RJ.avg,'--s4'],['Semau',SM.avg,'--s7']].map(([n,a,c])=>{const m=Math.max(...a);return [n,a.map(v=>v/m),c]});
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bentuk kurva beban lima sistem, dinormalisasi terhadap puncak rata-rata">
 ${[0,.25,.5,.75,1].map(t=>`<line class="gl" x1="${L}" x2="${W-Rm}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${t*100}%</text>`).join('')}
 <rect x="${x(5.5)}" y="${Tp}" width="${x(17.5)-x(5.5)}" height="${H-Tp-B}" fill="var(--sun)" opacity=".08"/>
 ${sets.map(([n,a,c])=>`<polyline class="ln" points="${a.map((v,h)=>`${x(h)},${y(v)}`).join(' ')}" stroke="var(${c})"/>`).join('')}
 ${[0,6,12,18,23].map(h=>`<text x="${x(h)}" y="${H-10}" text-anchor="middle">${HOUR(h)}</text>`).join('')}
 <line class="ax" x1="${L}" x2="${W-Rm}" y1="${y(0)}" y2="${y(0)}"/>
 ${Array.from({length:24},(_,h)=>`<rect class="hit" x="${x(h)-(W-L-Rm)/46}" y="${Tp}" width="${(W-L-Rm)/23}" height="${H-Tp-B}" data-tip="<b>${HOUR(h)}</b><br>${sets.map(([n,a])=>n+' '+pc(a[h])).join(' · ')}"/>`).join('')}</svg>
 <div class="legend">${sets.map(([n,,c])=>`<span><i class="l" style="background:var(${c})"></i>${n}</span>`).join('')}<span class="mute">beban rata-rata per jam ÷ jam tertinggi</span></div></div>`}

/* ---------- views ---------- */
function vRingkasan(){const pk4=R.peak+N.peak+S.peak+rjSep.peak,sewaShare=MX.sabu.share.sewa+MX.sabu.share.pv,hcAll=['rote','ndao','sabu','raijua','semau'].map(k=>A.simulate(A.SER[k],{pv:hc(k),bess:0}).re),reMax=Math.max(...hcAll);
 return `<section class="hero">
 <div class="card mapcard"><div class="map">${mapSvg()}
  ${SYS.map(s=>`<button class="chip${s.out?' o':''}" style="left:${s.cx}%;top:${s.cy}%" data-go="sistem" data-sys="${s.k}"><b>${s.n}</b>puncak ${f(s.peak)} kW</button>`).join('')}
  <span class="mlab" style="left:84%;top:16%">Kupang · asal kiriman BBM</span><span class="mlab i" style="left:42%;top:14%">Laut Sawu</span><span class="mlab" style="left:59%;top:61%">Ba'a</span><span class="mlab" style="left:16%;top:55%">Seba</span><span class="mlab" style="left:88%;top:89%">±50 km</span></div></div>
 <div class="card lead"><span class="tag">Pre-FS PLTS + BESS · RFP 1772 & 1773 · Nov 2026 – Apr 2027</span>
  <h1>Empat sistem, satu laut, <span>satu arah: lebih sedikit solar</span></h1>
  <p class="small mute">Lingkup kontrak: RFP 1773 (Rote + Ndao) dan RFP 1772 (Sabu). Raijua dan Semau ditampilkan karena datanya tersedia, tetapi berada di luar lingkup RFP. <a href="#insight">Lihat insight</a>.</p>
  <p class="mute">Data teknis PLN untuk kajian pra-kelayakan PLTS dan baterai: data mesin PLTD, neraca daya, langgam beban per jam per unit, dan single line diagram. Sejak data 24 Nov 2026, <b>semua sistem kajian sudah punya langgam beban per jam dari logsheet</b>. Klik pulau untuk masuk ke profil sistem.</p>
  <div class="kp">
   <div class="kpi"><b>${f(pk4)}<small> kW</small></b><span>jumlah beban puncak 4 sistem, semuanya dari logsheet (tidak simultan)</span></div>
   <div class="kpi"><b>${pc(sewaShare)}</b><span>energi Sabu Okt 2026 dibeli dari pembangkit sewa; ${pc(sewaRote/NR.dm)} daya mampu Rote juga sewa</span></div>
   <div class="kpi"><b>≤${f(reMax*100)}<small> %</small></b><span>porsi EBT maksimum tanpa baterai di kelima sistem (simulasi)</span></div>
   <div class="kpi"><b>19.00</b><span>jam puncak di semua sistem: energi surya harus digeser ke malam</span></div>
  </div></div></section>
 <section class="sec"><div class="hd"><h2>Posisi tiap sistem</h2><p class="mute">Biru = daya mampu PLTD milik PLN, biru muda = termasuk pembangkit sewa, jingga = beban puncak tercatat. Jika jingga melewati biru, sistem bergantung pada pembangkit sewa.</p></div>
 <div class="grid g5">${SYS.map(s=>{const mx=Math.max(s.cap,s.peak)*1.05,own=s.pln??s.cap,res=s.cap-s.peak;return `<div class="card sys"><div class="top"><div><h3>${s.n}</h3><span class="small mute">${s.role}</span></div><span class="tag${s.out?' w':''}">${s.out||s.proj}</span></div>
  <div class="meter v"><div><span>Mampu PLN</span><s style="width:${own/mx*100}%"></s><em>${f(own)} kW</em></div>${s.sewa?`<div><span>+ sewa</span><s class="dt" style="width:${s.cap/mx*100}%"></s><em>${f(s.cap)} kW</em></div>`:''}<div><span>Beban puncak</span><s class="pk" style="width:${s.peak/mx*100}%"></s><em>${f(s.peak)} kW</em></div></div>
  <p class="small">${res<0?`<span class="tag w">defisit ${f(-res)} kW</span>`:`<span class="tag ok">cadangan ${f(res)} kW (${f(res/s.cap*100)}%)</span>`} ${s.sewa?`<span class="tag w">tanpa sewa: kurang ${f(s.peak-own)} kW</span>`:''}</p>
  <button class="btn" data-go="sistem" data-sys="${s.k}">Lihat profil →</button></div>`}).join('')}</div></section>
 <section class="sec"><div class="hd"><h2>Data baru, temuan baru</h2><p class="mute">Tiga hal yang baru terlihat setelah langgam beban Rote (Sep 2026) dan logsheet per unit Sabu, Raijua, Semau (Okt 2026) masuk.</p></div><div class="grid g3">
  <div class="card"><h3>Rote: 8,5 MW terkonfirmasi, siang tidak pernah sepi</h3><p class="small mute" style="margin:6px 0 10px">Langgam per jam September 2026, 30 hari.</p>
   <div class="tiles" style="grid-template-columns:1fr 1fr">${T(f(R.peak),'kW',`puncak, ${R.pw[1]+1} Sep ${HOUR(R.pw[0])}`)}${T(f(R.dayMin),'kW','beban siang terendah (09–15)')}</div>
   <p class="small">Beban siang selalu di atas ±4,4 MW, sehingga PLTS sampai ±${f(hc('rote')/1000,1)} MWp bisa diserap tanpa baterai.</p><a class="btn" href="#beban" data-lg="rote">Langgam Rote</a></div>
  <div class="card"><h3>Sabu: siang hari sepenuhnya sewa</h3><p class="small mute" style="margin:6px 0 10px">Logsheet 15 unit, Oktober 2026.</p>
   <div class="tiles" style="grid-template-columns:1fr 1fr">${T(pc(MX.sabu.share.sewa),'','energi dari diesel sewa SPI')}${T(f(pvSabu.max),'kW','keluaran tertinggi PLTS Eilode')}</div>
   <p class="small">Mesin PLN mati pukul 10–16. PLTS Eilode sudah memikul sampai ${pc(A.PV.sabu.mxShare)} beban sesaat tanpa baterai.</p><a class="btn" href="#beban" data-lg="sabu">Langgam Sabu</a></div>
  <div class="card"><h3>PLTS yang ada belum bekerja penuh</h3><p class="small mute" style="margin:6px 0 10px">Semau dan Raijua, Oktober 2026.</p>
   <div class="tiles" style="grid-template-columns:1fr 1fr">${T(f(A.PV.semau.top),'kW',`batas rata PLTS Semau (${A.PVK.semau} kW), ${A.PV.semau.topN} jam`)}${T(RJ.zeros,'jam','padam di Raijua')}</div>
   <p class="small">Membuka batas Semau lebih murah daripada membangun PLTS baru. Raijua perlu keandalan dulu.</p><a class="btn" href="#simulator">Coba di simulator</a></div>
 </div></section>`}

function capChart(rows){const W=640,rowH=34,L=150,R=70,H=rows.length*rowH+30,mx=Math.max(...rows.map(r=>r.dt))*1.08,x=v=>L+v/mx*(W-L-R);
 const tk=[0,.25,.5,.75,1].map(t=>Math.round(mx*t/50)*50);
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daya terpasang, daya mampu netto dan daya mampu pasok tiap unit">
 ${tk.map(t=>`<line class="gl" x1="${x(t)}" x2="${x(t)}" y1="0" y2="${H-24}"/><text x="${x(t)}" y="${H-8}" text-anchor="middle">${f(t)}</text>`).join('')}
 ${rows.map((r,i)=>{const y=i*rowH+6;return `<text x="${L-8}" y="${y+16}" text-anchor="end" style="fill:var(--ink);font-weight:600">#${r.no} ${esc(r.merk)}</text>
  <rect x="${L}" y="${y}" width="${x(r.dt)-L}" height="7" fill="var(--q2)" rx="2"/><rect x="${L}" y="${y+8.5}" width="${x(r.dmn)-L}" height="7" fill="var(--sea)" rx="2"/><rect x="${L}" y="${y+17}" width="${Math.max(x(r.dmp)-L,0)}" height="7" fill="var(--acc)" rx="2"/>
  <text x="${x(r.dmp)+5}" y="${y+23}" style="fill:var(--ink);font-weight:600">${f(r.dmp)}</text>
  <rect class="hit" x="${L}" y="${y-2}" width="${W-L-R}" height="${rowH}" data-tip="<b>Unit ${r.no} · ${esc(r.merk)} ${esc(r.type)}</b><br>Terpasang ${f(r.dt)} kW · Mampu netto ${f(r.dmn,1)} kW<br>Mampu pasok ${f(r.dmp)} kW${r.seri?' · No. seri '+esc(r.seri):''}"/>`}).join('')}
 <line class="ax" x1="${L}" x2="${L}" y1="0" y2="${H-24}"/></svg>
 <div class="legend"><span><i style="background:var(--q2)"></i>Daya terpasang (DT)</span><span><i style="background:var(--sea)"></i>Daya mampu netto (DMN)</span><span><i style="background:var(--acc)"></i>Daya mampu pasok (DMP), berlabel</span></div></div>`}
function mesinTable(rows){const t=a=>rows.reduce((s,r)=>s+r[a],0);
 return `<div class="twrap"><table><thead><tr><th>#</th><th>Merk</th><th>Tipe</th><th>No. seri</th><th class="r">DT kW</th><th class="r">DMN kW</th><th class="r">DMP kW</th></tr></thead>
 <tbody>${rows.map(r=>`<tr><td>${r.no}</td><td>${esc(r.merk)}</td><td>${esc(r.type)}</td><td class="mute">${esc(r.seri)}</td><td class="r">${f(r.dt)}</td><td class="r">${f(r.dmn,1)}</td><td class="r">${f(r.dmp)}</td></tr>`).join('')}</tbody>
 <tfoot><tr><td colspan="4">Total ${rows.length} mesin</td><td class="r">${f(t('dt'))}</td><td class="r">${f(t('dmn'),1)}</td><td class="r">${f(t('dmp'))}</td></tr></tfoot></table></div>`}
const semauRows=()=>smDiesel.map((u,i)=>{const [m,...t]=u.n.split(' ');return {no:i+1,merk:m,type:t.join(' '),seri:'',dt:u.dt,dmn:u.dmn,dmp:u.dmp}});

function scenCards(k){const ser=A.SER[k],base=A.simulate(ser,{...A.BASE[k]});
 return `<div class="opts" style="margin-top:12px">${A.SCEN[k].map(([c,n,pv,b,bk])=>{const r=A.simulate(ser,{pv,bess:b,bkw:bk}),kl=(base.yr(base.dsl)-r.yr(r.dsl))*SIM.sfc/1000;
  return `<button class="opt" data-simgo="${k}" data-sc="${c}"><b>${f(r.re*100)}%</b>porsi EBT<strong>${c} · ${n}</strong>${f(pv)} kWp<br>${b?f(b)+' kWh / '+f(bk)+' kW':'tanpa baterai'}<br>hemat BBM ±${f(kl)} kL/th</button>`}).join('')}</div>`}
function vSistem(){const s=SYSK[sel.sys],mx=Math.max(s.cap,s.peak,s.dt||0)*1.04;
 return `<div class="filters"><div class="seg" role="tablist">${SYS.map(x=>`<button role="tab" aria-pressed="${x.k===sel.sys}" data-sys="${x.k}">${x.n}</button>`).join('')}</div><span class="small mute">${s.proj} · ${s.role}</span></div>
 <div class="grid g2">
 <div class="card sys"><div class="top"><div><h2>${s.n}</h2><span class="small mute">${s.role}</span></div><span class="tag${s.out?' w':''}">${s.out||s.proj}</span></div>
  <div class="meter">${s.dt?`<div><span>Daya terpasang</span><s class="dt" style="width:${s.dt/mx*100}%"></s><em>${f(s.dt)} kW</em></div>`:''}
  ${s.sewa?`<div><span>Mampu PLN sendiri</span><s style="width:${s.pln/mx*100}%"></s><em>${f(s.pln)} kW</em></div><div><span>Termasuk sewa</span><s class="dt" style="width:${s.cap/mx*100}%"></s><em>${f(s.cap)} kW</em></div>`
   :`<div><span>Daya mampu pasok</span><s style="width:${s.cap/mx*100}%"></s><em>${f(s.cap)} kW</em></div>`}
  ${s.n1?`<div><span>Mesin terbesar lepas (N-1)</span><s class="n1" style="width:${s.n1/mx*100}%"></s><em>${f(s.n1)} kW</em></div>`:''}
  <div><span>Beban puncak</span><s class="pk" style="width:${s.peak/mx*100}%"></s><em>${f(s.peak)} kW</em></div></div>
  <dl class="facts">${s.facts.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl><p class="warn">${s.warn}</p></div>
 <div class="card"><h3>Skenario PLTS + baterai (simulasi per jam)</h3><p class="small mute" style="margin-top:4px">Dihitung dari langgam ${s.k==='ndao'?'Jan–Okt':A.LG[s.k].label} dengan asumsi bawaan simulator. Klik kartu untuk mengubah sendiri.</p>
  ${scenCards(s.k)}
  <p class="note" style="margin-top:10px">Kapasitas serap PLTS tanpa baterai (energi terbuang ≤ 5%): <b>±${f(hc(s.k))} kWp</b>. Di atas itu, tambahan PLTS hanya berguna bersama BESS. Ukuran final keluar di laporan antara setelah simulasi HOMER dengan data 12 bulan.</p>
  ${s.k==='rote'?`<h4 style="margin-top:16px">Pembangkit Rote menurut neraca daya Sep 2026</h4><div class="twrap"><table><thead><tr><th>Lokasi</th><th>Merk / tipe</th><th class="r">Tahun</th><th class="r">kVA</th><th class="r">Daya mampu kW</th></tr></thead>
   <tbody>${NR.units.map(u=>`<tr><td>${esc(u.lok)}</td><td>${esc(u.merk)} ${esc(u.type)}</td><td class="r">${u.th}</td><td class="r">${f(u.kva)}</td><td class="r">${f(u.dm)}</td></tr>`).join('')}</tbody>
   <tfoot><tr><td colspan="4">Total · unit terbesar ${f(NR.terbesar)} kW · status ${NR.status}</td><td class="r">${f(NR.dm)}</td></tr></tfoot></table></div>
   <h4 style="margin-top:16px">Gardu per kode wilayah (dari SLD)</h4><div class="twrap"><table><thead><tr><th>Kode</th><th class="r">Gardu</th><th>Kode</th><th class="r">Gardu</th></tr></thead><tbody>
   <tr><td>LL</td><td class="r">67</td><td>NB</td><td class="r">44</td></tr><tr><td>BL</td><td class="r">35</td><td>RM</td><td class="r">33</td></tr><tr><td>BT</td><td class="r">30</td><td>RS</td><td class="r">28</td></tr><tr><td>PB</td><td class="r">26</td><td>RT</td><td class="r">21</td></tr><tr><td>LK</td><td class="r">13</td><td>ND (Ndao)</td><td class="r">4</td></tr></tbody>
   <tfoot><tr><td colspan="3">Trafo: 144 × 50 kVA, 34 × 100 kVA, 8 × 25 kVA, 5 × 160 kVA, dan beberapa 555–690 kVA</td><td class="r">±19,5 MVA</td></tr></tfoot></table></div>`:''}
  ${s.k==='sabu'?`<h4 style="margin-top:16px">Gardu dan trafo Sabu + Raijua (dari SLD Okt 2026)</h4><div class="twrap"><table><thead><tr><th>Kode</th><th class="r">Gardu</th><th>Trafo</th><th class="r">Unit</th></tr></thead><tbody>
   <tr><td>SB (Seba)</td><td class="r">73</td><td>50 kVA</td><td class="r">84</td></tr><tr><td>ST (Sabu Timur)</td><td class="r">30</td><td>100 kVA</td><td class="r">38</td></tr><tr><td>LA (Liae)</td><td class="r">12</td><td>160 kVA</td><td class="r">4</td></tr><tr><td>HM (Hawu Mehara)</td><td class="r">11</td><td>250 kVA</td><td class="r">4</td></tr><tr><td>RJ (Raijua)</td><td class="r">7</td><td>25 kVA</td><td class="r">1</td></tr></tbody>
   <tfoot><tr><td colspan="3">133 gardu · 131 trafo berlabel</td><td class="r">±9,7 MVA</td></tr></tfoot></table></div>`:''}
 </div></div>
 ${s.mesin?`<section class="sec"><div class="hd"><h2>Mesin PLTD ${s.n==='Sabu'?'Seba':s.n}</h2><p class="mute">Data mesin per November 2026. DT = daya terpasang, DMN = daya mampu netto, DMP = daya mampu pasok yang dipakai untuk neraca daya.</p></div>
 <div class="grid g2"><div class="card">${capChart(D.mesin[s.mesin])}</div><div class="card">${mesinTable(D.mesin[s.mesin])}</div></div></section>`
 :s.k==='semau'?`<section class="sec"><div class="hd"><h2>Mesin PLTD Semau</h2><p class="mute">Dari kepala lembar logsheet Oktober 2026 (data mesin resmi belum diterima).</p></div><div class="grid g2"><div class="card">${capChart(semauRows())}</div><div class="card">${mesinTable(semauRows())}</div></div></section>`
 :`<section class="sec"><div class="card"><h3>Rincian unit PLTD sewa BGP belum diterima</h3><p class="mute" style="margin-top:6px">Neraca daya hanya mencatat BGP sebagai satu blok 9.000 kW (beroperasi sejak 2018). Jumlah unit, merk, umur, dan konsumsi BBM per unit diperlukan untuk menghitung biaya pasok yang digantikan PLTS + BESS.</p></div></section>`}`}

/* ---------- langgam beban ---------- */
function ndaoMonthlyChart(){const st=A.ndStats,W=680,H=230,L=46,R=12,Tp=14,B=30,n=st.length,bw=(W-L-R)/n,mx=Math.max(...st.map(s=>s.peak))*1.12,y=v=>Tp+(H-Tp-B)-v/mx*(H-Tp-B);
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Beban puncak dan rata-rata bulanan Ndao">
 ${ticks(mx).map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${t}</text>`).join('')}
 ${st.map((s,i)=>{const x=L+i*bw,w=bw*.34,avg=s.energy/24;return `<rect x="${x+bw*.12}" y="${y(s.peak)}" width="${w}" height="${y(0)-y(s.peak)}" fill="var(--acc)" rx="3"/><rect x="${x+bw*.12+w+2}" y="${y(avg)}" width="${w}" height="${y(0)-y(avg)}" fill="var(--sea)" rx="3"/>
  ${s.sus.length?`<text x="${x+bw/2}" y="${y(s.peak)-5}" text-anchor="middle" style="fill:var(--warn);font-weight:700">!</text>`:''}
  <text x="${x+bw/2}" y="${H-10}" text-anchor="middle">${D.ndao[i].m.slice(0,3)}</text>
  <rect class="hit" x="${x}" y="${Tp}" width="${bw}" height="${H-Tp-B}" data-tip="<b>${D.ndao[i].label}</b><br>Puncak ${f(s.peak)} kW (tgl ${s.pw[1]+1}, ${HOUR(s.pw[0])})<br>Rata-rata ${f(avg)} kW · ${f(s.energy)} kWh/hari<br>Faktor beban ${f(s.lf*100)}%${s.sus.length?'<br>'+s.sus.length+' nilai anomali diabaikan':''}"/>`}).join('')}
 <line class="ax" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/></svg>
 <div class="legend"><span><i style="background:var(--acc)"></i>Beban puncak bulan (kW)</span><span><i style="background:var(--sea)"></i>Beban rata-rata (kW)</span><span class="mute">! = ada nilai di atas ${SUS} kW yang diabaikan</span></div></div>`}
const UNITS=[[1,'Unit 2','--s1'],[2,'Unit 3','--s2'],[4,'Unit 5','--s3'],[8,'PLTS','--s4'],[5,'Unit 6','--s5'],[6,'Unit 7','--s6'],[7,'Unit 8','--s7']];
function rjChart(m){const rows=m.rows,W=680,H=270,L=46,R=12,Tp=14,B=30,bw=(W-L-R)/24,mx=Math.max(...rows.map(r=>r[9]+r[8]))*1.12,y=v=>Tp+(H-Tp-B)-v/mx*(H-Tp-B);
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Pembebanan per unit per jam, ${esc(m.tanggal)}">
 ${[0,100,200,300,400].filter(t=>t<=mx).map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${t}</text>`).join('')}
 ${rows.map((r,h)=>{let acc=0;const x=L+h*bw+2,w=bw-4;const segs=UNITS.filter(([c])=>r[c]>0).map(([c,l,col])=>{const y0=y(acc+r[c]),hh=y(acc)-y(acc+r[c]);acc+=r[c];return `<rect x="${x}" y="${y0+1}" width="${w}" height="${Math.max(hh-2,1)}" fill="var(${col})" rx="2"/>`}).join('');
  return segs+`${h%3===0?`<text x="${x+w/2}" y="${H-10}" text-anchor="middle">${HOUR(h)}</text>`:''}<rect class="hit" x="${L+h*bw}" y="${Tp}" width="${bw}" height="${H-Tp-B}" data-tip="<b>${HOUR(h)}</b> · diesel ${f(r[9])} kW${r[8]?' + PLTS '+f(r[8])+' kW':''}<br>${UNITS.filter(([c])=>r[c]>0).map(([c,l])=>l+' '+f(r[c])+' kW').join(' · ')}"/>`}).join('')}
 <line class="ax" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/></svg>
 <div class="legend">${UNITS.map(([c,l,col])=>`<span><i style="background:var(${col})"></i>${l}</span>`).join('')}</div></div>`}
function rjMonthly(){const W=680,H=200,L=46,R=12,Tp=14,B=30,n=D.raijua.length,bw=(W-L-R)/n,mx=400,y=v=>Tp+(H-Tp-B)-v/mx*(H-Tp-B);
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Beban puncak bulanan Raijua">
 ${[0,100,200,300,400].map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${t}</text>`).join('')}
 <line x1="${L}" x2="${W-R}" y1="${y(340)}" y2="${y(340)}" stroke="var(--mute)" stroke-dasharray="4 4"/>
 ${D.raijua.map((m,i)=>{const x=L+i*bw,pv=Math.max(...m.rows.map(r=>r[8]));return `<rect x="${x+bw*.2}" y="${y(m.peak)}" width="${bw*.6}" height="${y(0)-y(m.peak)}" fill="var(--acc)" rx="3"/><text x="${x+bw/2}" y="${y(m.peak)-5}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${m.peak}</text><text x="${x+bw/2}" y="${H-10}" text-anchor="middle">${m.m}</text>
  <rect class="hit" x="${x}" y="${Tp}" width="${bw}" height="${H-Tp-B}" data-tip="<b>${m.label}</b><br>Puncak ${f(m.peak)} kW pada ${esc(m.tanggal)}, 19.00<br>PLTS tertinggi hari itu ${f(pv)} kW"/>`}).join('')}
 <line class="ax" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/></svg>
 <div class="legend"><span><i style="background:var(--acc)"></i>Beban puncak bulan (kW)</span><span><i class="l" style="background:var(--mute)"></i>Batas N-1 = 340 kW (mesin terbesar lepas)</span></div></div>`}
function rjTable(m){return `<details><summary>Tabel per unit ${esc(m.tanggal)}</summary><div class="twrap" style="margin-top:8px"><table><thead><tr><th>Jam</th>${UNITS.map(([,l])=>`<th class="r">${l}</th>`).join('')}<th class="r">Jumlah diesel</th></tr></thead>
 <tbody>${m.rows.map((r,h)=>`<tr><td>${HOUR(h)}</td>${UNITS.map(([c])=>`<td class="r">${r[c]||'·'}</td>`).join('')}<td class="r"><b>${r[9]}</b></td></tr>`).join('')}</tbody></table></div></details>`}
function ndaoSection(){const m=D.ndao[sel.ndao],s=A.ndStats[sel.ndao];
 return `<section><div class="hd"><h2>Ndao · langgam beban per jam, Januari–Oktober 2026</h2><p class="mute">Logsheet PLTD Ndao: 24 jam × 31 hari tiap bulan. Nilai 0 berarti padam atau tidak tercatat. Dua nilai di Maret (454 kW dan 815 kW) jauh di atas daya mampu 280 kW dan diabaikan dalam ringkasan, tetapi tetap ditampilkan di tabel.</p></div>
 <div class="card" style="margin-bottom:16px"><h3>Puncak dan rata-rata tiap bulan</h3>${ndaoMonthlyChart()}</div>
 <div class="filters"><div class="seg" role="tablist">${D.ndao.map((x,i)=>`<button role="tab" aria-pressed="${i===sel.ndao}" data-nd="${i}">${x.m}</button>`).join('')}</div></div>
 <div class="tiles">${T(f(s.peak),'kW',`puncak, tgl ${s.pw[1]+1} pukul ${HOUR(s.pw[0])}`)}${T(f(s.energy),'kWh','energi rata-rata per hari')}${T(f(s.day),'kW','rata-rata siang 10–16')}${T(f(s.night),'kW','rata-rata malam 19–22')}${T(f(s.lf*100),'%','faktor beban')}${T(s.zeros,'',`jam bernilai 0${s.sus.length?` · ${s.sus.length} anomali`:''}`)}</div>
 <div class="grid g2"><div class="card"><h3>Kurva harian rata-rata · ${m.label}</h3>${curve(m.label,s)}</div><div class="card"><h3>Peta panas jam × tanggal · ${m.label}</h3>${heat(m.grid,m.ndays,m.label,250,SUS)}</div></div>
 <div class="card" style="margin-top:16px">${gridTable(m.grid,m.ndays,m.label,SUS)}</div></section>`}
const LGNOTE={
 rote:`Neraca daya September 2026, lembar LF ROTE: beban sistem Rote per jam selama 30 hari (pembangkit tercatat "Rental BGP"). Tiga jam turun tajam (tgl 2 dan 13 pukul 09.00, tgl 16 pukul 02.00) dibaca sebagai gangguan, bukan beban.`,
 sabu:`Logsheet PLTD Seba Oktober 2026: 12 mesin PLN, diesel sewa SPI dan PLTS sewa SPI (hybrid Eilode), per jam selama 31 hari. Total = jumlah semua unit, identik dengan lembar rekap.`,
 raijua:`Logsheet PLTD Raijua Oktober 2026: 8 mesin diesel dan PLTS on-grid dengan baterai, per jam selama 31 hari. Jam bernilai 0 di seluruh unit dihitung sebagai padam.`,
 semau:`Logsheet PLTD Semau Oktober 2026: 5 mesin diesel dan PLTS on-grid, per jam selama 31 hari. Semau berada di luar lingkup RFP; ditampilkan sebagai pembanding pulau kecil.`};
function lgSection(k){const L=A.LG[k],s=LS[k],sy=SYSK[k],mon=L.bulan;
 return `<section><div class="hd"><h2>${sy.n} · langgam beban per jam, ${L.label}</h2><p class="mute">${LGNOTE[k]}</p></div>
 <div class="tiles">${T(f(s.peak),'kW',`puncak, ${s.pw[1]+1} ${mon} pukul ${HOUR(s.pw[0])}`)}${T(f(s.energy),'kWh','energi rata-rata per hari')}${T(f(s.day),'kW','rata-rata siang 10–16')}${T(f(s.night),'kW','rata-rata malam 19–22')}${T(f(s.dayMin),'kW','beban siang terendah 09–15')}${T(f(s.lf*100),'%','faktor beban')}${T(s.zeros,'',`jam padam · ${s.dips.length} jam gangguan`)}</div>
 <div class="grid g2"><div class="card"><h3>Kurva harian rata-rata · ${L.label}</h3>${curve(sy.n+' '+L.label,s)}</div><div class="card"><h3>Peta panas jam × tanggal · ${L.label}</h3>${heat(L.tot,L.ndays,sy.n+' '+L.label,Math.ceil(s.peak/100)*100,Infinity,Math.floor(s.dayMin*.8/100)*100)}</div></div>
 <div class="grid g2" style="margin-top:16px"><div class="card"><h3>Energi per hari</h3>${dailyChart(L.tot,L.ndays,s,mon)}</div>
 ${MX[k]?`<div class="card"><h3>Siapa memasok jam berapa</h3><p class="small mute" style="margin:4px 0 8px">Rata-rata ${L.ndays} hari, per kelompok pembangkit.</p>${mixChart(k)}</div>`:`<div class="card"><h3>Neraca daya harian · September 2026</h3><p class="small mute" style="margin:4px 0 8px">Dari lembar ND BAA. Status ${NR.status} setiap hari.</p>${neracaChart()}</div>`}</div>
 ${MX[k]?`<div class="card" style="margin-top:16px"><h3>Operasi per unit · ${L.label}</h3>${unitTable(k)}</div>`:''}
 <div class="card" style="margin-top:16px">${gridTable(L.tot,L.ndays,sy.n+' '+L.label)}</div></section>`}
function rjPeakSection(){const rm=D.raijua[sel.raijua],rt=rm.rows.map(r=>r[9]),rpk=Math.max(...rt),rh=rt.indexOf(rpk),rE=rt.reduce((a,b)=>a+b,0),pvE=rm.rows.reduce((a,r)=>a+r[8],0),pvMax=Math.max(...rm.rows.map(r=>r[8]));
 return `<section class="sec"><div class="hd"><h2>Raijua · hari beban tertinggi tiap bulan, Mei–Oktober 2026</h2><p class="mute">Laporan rekapitulasi PLTD Raijua: pembebanan per unit mesin pada hari puncak bulanan. Kolom PLTS dicatat terpisah dan tidak termasuk dalam jumlah diesel. Puncak selalu pukul 19.00. Hari puncak Oktober (20 Okt, 332 kW) identik dengan logsheet bulanan di atas.</p></div>
 <div class="card" style="margin-bottom:16px"><h3>Beban puncak bulanan vs batas N-1</h3>${rjMonthly()}</div>
 <div class="filters"><div class="seg" role="tablist">${D.raijua.map((x,i)=>`<button role="tab" aria-pressed="${i===sel.raijua}" data-rj="${i}">${x.m}</button>`).join('')}</div><span class="small mute">${esc(rm.tanggal)}${rm.m==='MEI'?' (tanggal pada lembar sumber tertulis Juni, kemungkinan salah ketik)':''}</span></div>
 <div class="tiles">${T(f(rpk),'kW',`puncak diesel, pukul ${HOUR(rh)}`)}${T(f(rE),'kWh','produksi diesel hari itu')}${T(f(pvE),'kWh','produksi PLTS hari itu')}${T(f(pvMax),'kW','output PLTS tertinggi')}${T(f(Math.min(...rt.filter(v=>v>0))),'kW','beban diesel terendah')}${T(UNITS.filter(([c])=>c!==8&&rm.rows.some(r=>r[c]>0)).length,'','unit diesel beroperasi')}</div>
 <div class="card"><h3>Pembebanan per unit · ${esc(rm.tanggal)}</h3>${rjChart(rm)}${rjTable(rm)}</div></section>`}
const LGTABS=[['rote','Rote · Sep'],['ndao','Ndao · Jan–Okt'],['sabu','Sabu · Okt'],['raijua','Raijua · Okt'],['semau','Semau · Okt']];
function vBeban(){const k=sel.lg;
 return `<div class="filters"><div class="seg" role="tablist">${LGTABS.map(([x,l])=>`<button role="tab" aria-pressed="${x===k}" data-lg="${x}">${l}</button>`).join('')}</div><span class="small mute">Pilih sistem</span></div>
 ${k==='ndao'?ndaoSection():lgSection(k)}${k==='raijua'?rjPeakSection():''}
 <section class="sec grid g2"><div class="card"><h3>Bentuk kurva lima sistem</h3><p class="small mute" style="margin:4px 0 8px">Beban rata-rata per jam dibagi jam tertinggi masing-masing.</p>${shapeChart()}</div>
 <div class="card"><h3>Cara membaca</h3><ul class="clean small" style="margin-top:8px"><li>Semua sistem memuncak pukul 19.00, satu jam setelah matahari terbenam.</li><li>Raijua paling curam: siang hanya ±${pc(Math.min(...RJ.avg.slice(9,16))/Math.max(...RJ.avg))} dari puncak, jadi PLTS tanpa baterai cepat terbuang.</li><li>Rote paling rata (faktor beban ${pc(R.lf)}): siang tetap ±${pc(Math.min(...R.avg.slice(9,16))/Math.max(...R.avg))} dari puncak, sehingga PLTS besar masih terserap tanpa baterai.</li><li>Lonjakan pukul 17.00 → 19.00 adalah ramp yang harus dipikul diesel atau BESS: Rote +${f(R.avg[18]-R.avg[16])} kW, Sabu +${f(S.avg[18]-S.avg[16])} kW dalam dua jam.</li></ul></div></section>`}

/* ---------- simulator ---------- */
const SIMK=[['rote','Rote'],['ndao','Ndao'],['sabu','Sabu'],['raijua','Raijua'],['semau','Semau']];
const simPeak=k=>Math.max(...A.SER[k]);
const simLim=k=>{const p=simPeak(k),r=v=>{const m=10**Math.floor(Math.log10(v));return Math.ceil(v/m)*m};return {pv:r(p*3),bess:r(p*8),bkw:r(p*1.2)}};
function simPreset(k,c){const s=A.SCEN[k].find(x=>x[0]===c);SIM.clip=undefined;if(c==='now'){const b=A.BASE[k];Object.assign(SIM,{k,pv:b.pv,bess:0,bkw:0,clip:b.clip})}else if(s)Object.assign(SIM,{k,pv:s[2],bess:s[3],bkw:s[4]});SIM.sc=c}
function simRun(){const o={pv:SIM.pv,bess:SIM.bess,bkw:SIM.bkw,yld:SIM.yld,dmin:SIM.dmin/100,clip:SIM.clip};return {o,r:A.simulate(A.SER[SIM.k],o),base:A.simulate(A.SER[SIM.k],{...A.BASE[SIM.k],yld:SIM.yld,dmin:SIM.dmin/100})}}
function simDay(prof){const W=680,H=280,L=56,R=12,Tp=14,B=30,bw=(W-L-R)/24,pos=p=>p.dsl+p.pv+p.dis,neg=p=>p.ch+p.curt,mxP=Math.max(...prof.map(p=>Math.max(pos(p),p.load)))*1.08,mxN=Math.max(...prof.map(neg),1),span=mxP+mxN,z=Tp+(H-Tp-B)*mxP/span,y=v=>z-v/span*(H-Tp-B),tk=ticks(mxP,4);
 const segs=[['dsl','Diesel','var(--mute)'],['pv','PLTS langsung','var(--s4)'],['dis','Baterai keluar','var(--s3)']],nsegs=[['ch','Mengisi baterai','var(--s1)'],['curt','Terbuang','var(--warn)']];
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Profil pasokan hari rata-rata">
 ${tk.map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end">${f(t)}</text>`).join('')}
 ${prof.map((p,h)=>{const x=L+h*bw+2,w=bw-4;let a=0,b=0;return segs.map(([k,,c])=>{const v=p[k];if(v<=.5)return '';const y0=y(a+v),hh=y(a)-y0;a+=v;return `<rect x="${x}" y="${y0}" width="${w}" height="${Math.max(hh,.5)}" fill="${c}"/>`}).join('')+
  nsegs.map(([k,,c])=>{const v=p[k];if(v<=.5)return '';const y0=y(-b),hh=y(-b-v)-y0;b+=v;return `<rect x="${x}" y="${y0}" width="${w}" height="${Math.max(hh,.5)}" fill="${c}" opacity=".75"/>`}).join('')+
  `${h%3===0?`<text x="${x+w/2}" y="${H-10}" text-anchor="middle">${HOUR(h)}</text>`:''}<rect class="hit" x="${L+h*bw}" y="${Tp}" width="${bw}" height="${H-Tp-B}" data-tip="<b>${HOUR(h)}</b> · beban ${f(p.load)} kW<br>Diesel ${f(p.dsl)} · PLTS ${f(p.pv)} · baterai ${f(p.dis)} kW${p.ch>.5?'<br>mengisi baterai '+f(p.ch)+' kW':''}${p.curt>.5?'<br>terbuang '+f(p.curt)+' kW':''}"/>`}).join('')}
 <polyline class="ln" points="${prof.map((p,h)=>`${L+h*bw+bw/2},${y(p.load)}`).join(' ')}" stroke="var(--ink)" stroke-dasharray="4 3"/>
 <line class="ax" x1="${L}" x2="${W-R}" y1="${z}" y2="${z}"/></svg>
 <div class="legend">${[...segs,...nsegs].map(([,l,c])=>`<span><i style="background:${c}"></i>${l}</span>`).join('')}<span><i class="l" style="background:var(--ink)"></i>Beban</span></div></div>`}
function simSens(){const k=SIM.k,lim=simLim(k),ser=A.SER[k],n=16,xs=Array.from({length:n+1},(_,i)=>i/n*lim.pv),o={yld:SIM.yld,dmin:SIM.dmin/100};
 const l0=xs.map(pv=>A.simulate(ser,{...o,pv,bess:0}).re),l1=SIM.bess?xs.map(pv=>A.simulate(ser,{...o,pv,bess:SIM.bess,bkw:SIM.bkw}).re):null,hcv=A.hosting(k,o);
 const W=680,H=230,L=46,R=12,Tp=14,B=30,mxY=Math.max(1e-3,...l0,...(l1||[]))*1.1,x=v=>L+v/lim.pv*(W-L-R),y=v=>Tp+(H-Tp-B)-v/mxY*(H-Tp-B),cur=A.simulate(ser,{...o,pv:SIM.pv,bess:SIM.bess,bkw:SIM.bkw}).re;
 return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Porsi EBT terhadap ukuran PLTS">
 ${ticks(mxY*100,4).map(t=>`<line class="gl" x1="${L}" x2="${W-R}" y1="${y(t/100)}" y2="${y(t/100)}"/><text x="${L-6}" y="${y(t/100)+4}" text-anchor="end">${t}%</text>`).join('')}
 ${ticks(lim.pv,5).map(t=>`<text x="${x(t)}" y="${H-10}" text-anchor="middle">${f(t)}</text>`).join('')}
 <line x1="${x(hcv)}" x2="${x(hcv)}" y1="${Tp}" y2="${y(0)}" stroke="var(--mute)" stroke-dasharray="4 4"/><text x="${x(hcv)+4}" y="${Tp+10}">serap tanpa baterai ±${f(hcv)} kWp</text>
 <polyline class="ln" points="${xs.map((v,i)=>`${x(v)},${y(l0[i])}`).join(' ')}" stroke="var(--s2)"/>
 ${l1?`<polyline class="ln" points="${xs.map((v,i)=>`${x(v)},${y(l1[i])}`).join(' ')}" stroke="var(--s3)"/>`:''}
 <circle cx="${x(Math.min(SIM.pv,lim.pv))}" cy="${y(cur)}" r="5" fill="var(--acc)" stroke="var(--card)" stroke-width="2"/>
 <line class="ax" x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}"/>
 ${xs.map((v,i)=>`<rect class="hit" x="${x(v)-(W-L-R)/n/2}" y="${Tp}" width="${(W-L-R)/n}" height="${H-Tp-B}" data-tip="<b>${f(v)} kWp</b><br>tanpa baterai ${pc(l0[i])}${l1?'<br>dengan '+f(SIM.bess)+' kWh '+pc(l1[i]):''}"/>`).join('')}</svg>
 <div class="legend"><span><i class="l" style="background:var(--s2)"></i>Tanpa baterai</span>${l1?`<span><i class="l" style="background:var(--s3)"></i>Dengan BESS ${f(SIM.bess)} kWh / ${f(SIM.bkw)} kW</span>`:''}<span><i style="background:var(--acc);border-radius:50%"></i>Pilihan sekarang</span><span class="mute">sumbu datar: kWp PLTS</span></div></div>`}
function simOut(){const {r,base}=simRun(),k=SIM.k,sv=base.yr(base.dsl)-r.yr(r.dsl),kl=sv*SIM.sfc/1000,pk=simPeak(k);
 return `<div class="tiles">${T(pc(r.re),'',`porsi EBT (sekarang ${pc(base.re,1)})`)}${T(f(kl),'kL/th','BBM yang dihemat')}${T(f(kl*2.68),'t CO₂/th','emisi dihindari')}${T(pc(r.curtPct),'','energi PLTS terbuang')}${T(f(r.offH,1),'jam/hari','diesel bisa mati')}${T(f(r.dslMax),'kW',`diesel tertinggi yang tetap perlu (puncak ${f(pk)})`)}</div>
 <div class="grid"><div class="card"><h3>Hari rata-rata dengan skenario ini</h3>${simDay(r.prof)}</div><div class="card"><h3>Porsi EBT vs ukuran PLTS</h3><p class="small mute" style="margin:4px 0 8px">Garis jingga mendatar setelah kapasitas serap: tambahan panel hanya terbuang tanpa baterai.</p>${simSens()}</div></div>
 <p class="note" style="margin-top:12px">Energi tahunan = hasil ${f(r.days)} hari data × 365/${f(r.days)}. Diesel tahunan sekarang ±${f(base.yr(base.dsl)/1e6,2)} GWh; dengan skenario ±${f(r.yr(r.dsl)/1e6,2)} GWh. PLTS menghasilkan ±${f(r.yr(r.pv)/1e6,2)} GWh/th, ${pc(1-r.curtPct)} terpakai.</p>`}
function vSim(){const k=SIM.k,lim=simLim(k),st=v=>{const m=10**Math.floor(Math.log10(v/100));return m};
 const rng=(key,label,max,unit,step)=>`<label class="rng"><span>${label}<output id="o-${key}">${f(SIM[key],key==='yld'||key==='sfc'?2:0)} ${unit}</output></span><input type="range" data-sim="${key}" min="0" max="${max}" step="${step}" value="${SIM[key]}"></label>`;
 return `<section><div class="hd"><h2>Simulator PLTS + BESS</h2><p class="mute">Simulasi per jam dari langgam beban nyata: PLTS dulu, baterai mengisi dari kelebihan surya dan mengosongkan saat beban melebihi surya, diesel menutup sisanya. Tanpa baterai, diesel harus tetap menyala dan memikul minimal sekian persen beban. Alat penyaring awal, bukan pengganti HOMER.</p></div>
 <div class="filters"><div class="seg" role="tablist">${SIMK.map(([x,l])=>`<button role="tab" aria-pressed="${x===k}" data-simk="${x}">${l}</button>`).join('')}</div><span class="small mute">Data: ${k==='ndao'?'Jan–Okt 2026, 306 hari':A.LG[k].label+', '+A.LG[k].ndays+' hari'} · puncak ${f(simPeak(k))} kW</span></div>
 <div class="simgrid"><div class="card simctl"><h3>Skenario</h3>
  <div class="presets"><button class="btn${SIM.sc==='now'?' pri':''}" data-sc="now">Sekarang</button>${A.SCEN[k].map(([c,n])=>`<button class="btn${SIM.sc===c?' pri':''}" data-sc="${c}" title="${n}">${c}</button>`).join('')}</div>
  ${rng('pv','PLTS',lim.pv,'kWp',st(lim.pv))}${rng('bess','Baterai, kapasitas',lim.bess,'kWh',st(lim.bess))}${rng('bkw','Baterai, daya',lim.bkw,'kW',st(lim.bkw))}
  <details open><summary>Asumsi</summary><div style="margin-top:8px">${rng('yld','Produksi PLTS',7,'kWh/kWp/hari',.1)}${rng('dmin','Beban minimum diesel saat menyala',80,'% beban',5)}${rng('sfc','Konsumsi BBM',.4,'L/kWh',.01)}</div>
  <p class="small mute">Bawaan: 4,8 kWh/kWp/hari (PLTS Eilode tercatat ${f(A.PV.sabu.yld,1)} di Oktober, bulan paling cerah) · 50% (Eilode sudah mencapai ${pc(A.PV.sabu.mxShare)} beban sesaat) · 0,28 L/kWh · baterai 90% bolak-balik, SOC minimum 10%. Bentuk kurva surya dari PLTS Eilode Okt 2026.</p></details></div>
 <div id="simout">${simOut()}</div></div></section>`}

/* ---------- insight ---------- */
function vInsight(){const nd=A.ndStats,pkM=N.pkM,pk=nd[pkM];
 const KEYS=['rote','ndao','sabu','raijua','semau'],HCV=Object.fromEntries(KEYS.map(k=>[k,hc(k)])),HCRE=Object.fromEntries(KEYS.map(k=>[k,A.simulate(A.SER[k],{pv:HCV[k],bess:0}).re]));
 const rjPk=D.raijua.reduce((b,m)=>m.peak>b.peak?m:b,D.raijua[0]),rjOver=D.raijua.filter(m=>m.peak>C.raijua.n1).map(m=>m.m);
 const oddM=D.ndao.map((m,i)=>nd[i].pw[0]<5?m.m.slice(0,3)+' '+HOUR(nd[i].pw[0]):null).filter(Boolean);
 const sabuPlnIdle=MX.sabu.units.filter(u=>u.g==='pln'&&u.days<=3).length;
 const card=(t,sub,find,rec,tag)=>`<div class="card"><div class="hd" style="margin-bottom:6px"><div><h3>${t}</h3><span class="small mute">${sub}</span></div>${tag||''}</div>
  <h4>Temuan dari data</h4><ul class="clean small" style="margin:6px 0 12px">${find.map(x=>`<li>${x}</li>`).join('')}</ul>
  <h4>Rekomendasi</h4><div class="steps" style="margin-top:6px">${rec.map((x,i)=>`<div><i>${i+1}</i><span>${x}</span></div>`).join('')}</div></div>`;
 const row=(n,src,s,pvNow,sewa,rel,k)=>`<tr><td><b>${n}</b><br><span class="small mute">${src}</span></td><td class="r">${f(s.peak)}</td><td class="r">${f(s.energy)}</td><td class="r">${pc(s.lf)}</td><td class="r">${f(s.night/s.day,2)}×</td><td class="r">${f(s.dayMin)}</td><td class="r">${pvNow}</td><td class="r">${sewa}</td><td class="r">${rel}</td><td class="r"><b>${f(HCV[k])}</b> kWp<br><span class="small mute">EBT ${pc(HCRE[k])}</span></td></tr>`;
 return `<section><div class="hd"><h2>Insight & rekomendasi</h2><p class="mute">Semua angka di halaman ini dihitung langsung dari berkas PLN di portal (data mesin, neraca daya, langgam beban, SLD) dan dibaca terhadap lingkup RFP IESR 1772 dan 1773. Angka berubah otomatis jika data diperbarui.</p></div>
 <div class="tiles">${T(f(R.peak),'kW',`puncak Rote terverifikasi, ${pc(sewaRote/NR.dm)} daya mampu dari sewa`)}${T(pc(MX.sabu.share.sewa+MX.sabu.share.pv),'','energi Sabu Okt dari pembangkit sewa')}${T('13–16','%','batas porsi EBT tanpa baterai, semua sistem')}${T(f(HCV.rote/1000,1),'MWp','PLTS Rote yang terserap tanpa baterai')}${T(pc(1-A.PV.semau.top/A.PVK.semau),'','kapasitas PLTS Semau menganggur')}${T(RJ.zeros,'jam','padam Raijua di Oktober')}</div>
 <section class="sec" style="margin-top:8px"><div class="hd"><h2>Lima temuan lintas sistem</h2></div><div class="grid g2">
  <div class="card"><h3>1 · Semua sistem memuncak pukul 19.00</h3><p class="small" style="margin:6px 0 10px">Rasio beban malam (19–22) terhadap siang (10–16) berkisar ${f(R.night/R.day,1)}× (Rote) sampai ${f(RJ.night/RJ.day,1)}× (Raijua). Surya tersedia pukul 06–18, beban tertinggi datang satu jam setelah matahari terbenam. Pada porsi EBT di atas ±15%, nilai proyek ditentukan oleh baterai, bukan panel.</p>${shapeChart()}</div>
  <div class="grid" style="align-content:start">
  <div class="card"><h3>2 · Tanpa baterai, EBT mentok ±13–16%</h3><p class="small" style="margin-top:6px">Simulasi per jam dengan diesel minimal 50% beban saat menyala menunjukkan kapasitas serap PLTS (energi terbuang ≤ 5%) hanya <b>${f(HCV.rote)} kWp di Rote, ${f(HCV.sabu)} kWp di Sabu (Eilode sudah 1.400), ${f(HCV.ndao)} kWp di Ndao, ${f(HCV.raijua)} kWp di Raijua (sudah terpasang 150), dan ${f(HCV.semau)} kWp di Semau</b>. Di semua sistem itu setara porsi EBT ${f(Math.min(...KEYS.map(k=>HCRE[k]))*100)}–${f(Math.max(...KEYS.map(k=>HCRE[k]))*100)}%. Target RFP untuk porsi EBT tinggi hanya tercapai dengan BESS grid-forming.</p></div>
  <div class="card"><h3>3 · Yang digantikan adalah sewa, bukan hanya solar</h3><p class="small" style="margin-top:6px">Rote: ${f(sewaRote)} dari ${f(NR.dm)} kW daya mampu adalah PLTD sewa BGP; PLTD milik PLN hanya ${f(plnRote)} kW. Sabu: ${pc(MX.sabu.share.sewa)} energi dari diesel sewa SPI dan ${pc(MX.sabu.share.pv)} dari PLTS sewa; ${sabuPlnIdle} dari 12 mesin PLN menyala ≤ 3 hari dalam sebulan. Biaya yang dihindari PLTS + BESS adalah tarif sewa (kapasitas + energi) ditambah BBM, sehingga kasus ekonominya lebih kuat dari perhitungan BBM saja. Kontrak sewa BGP dan SPI adalah data paling penting yang belum ada.</p></div>
  <div class="card"><h3>4 · PLTS yang ada belum bekerja penuh</h3><p class="small" style="margin-top:6px">Semau: keluaran tertahan rata di ${f(A.PV.semau.top)} kW selama ${A.PV.semau.topN} jam padahal inverter ${A.PVK.semau} kW (${f(A.PV.semau.yld,1)} kWh/kW/hari). Raijua: ${f(A.PV.raijua.yld,1)} kWh/kW/hari, puncak ${f(A.PV.raijua.max)} dari ${A.PVK.raijua} kW. Eilode: keluaran sering tepat 1.000 / 1.100 / 1.200 kW, tanda setelan pembatas oleh operator. Memperbaiki batas ini adalah EBT termurah yang tersedia.</p></div>
  <div class="card"><h3>5 · Keandalan pulau kecil lemah</h3><p class="small" style="margin-top:6px">Raijua padam ${RJ.zeros} jam di Oktober (${pc(RJ.zeros/RJ.hours,1)} waktu) dan ${rjOver.length} dari 6 bulan puncaknya melampaui N-1 ${f(C.raijua.n1)} kW. Ndao gagal N-1 pada jam puncak. Rote berstatus ${NR.status}, tetapi mengalami 3 gangguan besar di September (turun ke ±2,4–3,4 MW). BESS grid-forming memberi manfaat keandalan yang perlu dihitung terpisah dari penghematan BBM.</p></div></div>
 </div></section>
 <section class="sec"><div class="hd"><h2>Perbandingan lima sistem</h2><p class="mute">Ndao = rata-rata 10 bulan; lainnya satu bulan penuh. Beban siang terendah tidak menghitung jam padam dan gangguan.</p></div>
 <div class="card"><div class="twrap"><table><thead><tr><th>Sistem</th><th class="r">Puncak kW</th><th class="r">Energi kWh/hari</th><th class="r">Faktor beban</th><th class="r">Malam ÷ siang</th><th class="r">Siang terendah kW</th><th class="r">PLTS sekarang</th><th class="r">Pasokan sewa</th><th class="r">Padam / gangguan</th><th class="r">Serap PLTS tanpa BESS</th></tr></thead><tbody>
  ${row('Rote','Sep 2026 · RFP 1773',R,'180 kWp · ±0%',`${pc(sewaRote/NR.dm)} daya mampu`,`0 / ${R.dips.length} jam`,'rote')}
  ${row('Ndao','Jan–Okt 2026 · RFP 1773',{...N,dayMin:Math.min(...nd.map(s=>s.dayMin))},'—','—',`${N.zeros} / ${nd.reduce((a,s)=>a+s.dips.length,0)} jam`,'ndao')}
  ${row('Sabu','Okt 2026 · RFP 1772',S,`1.400 kWp · ${pc(MX.sabu.share.pv)}`,`${pc(MX.sabu.share.sewa+MX.sabu.share.pv)} energi`,`${S.zeros} / ${S.dips.length} jam`,'sabu')}
  ${row('Raijua','Okt 2026 · di luar RFP',RJ,`150 kW · ${pc(MX.raijua.share.pv)}`,'—',`${RJ.zeros} / ${RJ.dips.length} jam`,'raijua')}
  ${row('Semau','Okt 2026 · di luar RFP',SM,`450 kW · ${pc(MX.semau.share.pv)}`,'—',`${SM.zeros} / ${SM.dips.length} jam`,'semau')}
 </tbody></table></div></div></section>
 <section class="sec"><div class="hd"><h2>Per sistem</h2></div><div class="grid g2">
 ${card('Rote','RFP 1773 · sistem besar · PLTD sewa BGP 9 MW',[
  `Puncak ${f(R.peak)} kW (${R.pw[1]+1} Sep, ${HOUR(R.pw[0])}) dari logsheet, cocok dengan label SLD 8.500 kW. Energi ±${f(R.energy)} kWh/hari (±${f(R.energy*365/1e6,1)} GWh/th), faktor beban ${pc(R.lf)}: terbesar dan paling rata dari lima sistem.`,
  `Beban siang 10–16 rata-rata ${f(R.day)} kW dan tidak pernah di bawah ${f(R.dayMin)} kW di luar gangguan. Karena itu PLTS sampai ±${f(HCV.rote)} kWp terserap tanpa baterai: Rote adalah tempat termurah untuk menambah EBT per kWh.`,
  `Neraca daya: daya mampu ${f(NR.dm)} kW, ${f(sewaRote)} kW di antaranya sewa BGP. Cadangan operasi ${f(Math.min(...NR.cadOp))}–${f(Math.max(...NR.cadOp))} kW (${pc(Math.min(...NR.cadOp)/NR.dm)}–${pc(Math.max(...NR.cadOp)/NR.dm)}). Neraca mencatat unit terbesar ${f(NR.terbesar)} kW, padahal Cummins Ba'a 1.000 kW.`,
  `Beban naik ±${f((R.avg[18]-R.avg[16])/1000,1)} MW antara pukul 17.00 dan 19.00. Ramp ini yang harus dipikul BESS bila diesel sewa dikurangi.`],
  [`Tahap 1: PLTS ±${f(Math.floor(HCV.rote/1000))}–5 MWp tanpa baterai dekat GH Ba'a/Onatali; porsi EBT ±${f(HCRE.rote*100)}% tanpa risiko stabilitas.`,
   'Tahap 2: BESS grid-forming yang ukurannya ditentukan oleh kapasitas sewa BGP yang ingin dilepas, bukan hanya oleh energi surya yang digeser.',
   'Minta kontrak sewa BGP (tarif kapasitas, tarif energi, masa kontrak), rincian unit, dan BBM bulanan. Tanpa itu LCOE pembanding tidak bisa dihitung.',
   'Minta langgam per penyulang dan 12 bulan beban sistem untuk melihat musim; satu bulan September belum cukup untuk sizing final.'])}
 ${card('Sabu','RFP 1772 · sistem besar · 5 penyulang',[
  `Puncak ${f(S.peak)} kW (${S.pw[1]+1} Okt, ${HOUR(S.pw[0])}), di atas perkiraan ±4.200 kW. Energi ±${f(S.energy)} kWh/hari, faktor beban ${pc(S.lf)}.`,
  `Pukul 10–16 mesin PLN mati; sistem dipikul diesel sewa SPI + PLTS Eilode. Malam hari ${MX.sabu.units.filter(u=>u.g==='pln'&&u.days>10).map(u=>u.n).join(', ')} masuk. PLN pada praktiknya memakai PLTD Seba sebagai pemikul puncak malam.`,
  `PLTS Eilode memasok ${pc(MX.sabu.share.pv)} energi dan sampai ${pc(A.PV.sabu.mxShare)} beban sesaat, tanpa baterai. Produksi ${f(A.PV.sabu.yld,1)} kWh/kWp/hari di Oktober. Kapasitas serap tanpa baterai ±${f(HCV.sabu)} kWp: ruang tambah PLTS tanpa BESS tinggal ±${f(HCV.sabu-1400)} kWp.`,
  `Diesel sewa SPI tercatat DT/DMP 1.500 kW, tetapi keluarannya sampai ${f(sewaSabu.max)} kW. Kapasitas kontrak sebenarnya perlu dikonfirmasi.`],
  ['Prioritaskan BESS di Eilode: menggeser kelebihan surya siang ke puncak 19.00 dan mengurangi kapasitas sewa yang dibayar.',
   'Minta kontrak SPI (kapasitas, tarif, masa berlaku) dan produksi + curtailment harian PLTS Eilode; nilai 1.000/1.100/1.200 kW yang berulang menandakan pembatasan.',
   'Studi integrasi jaringan per penyulang (Sec. 2.4 RFP), karena siang hari seluruh beban dipasok dari satu titik (Eilode).',
   'Gunakan bentuk kurva Eilode sebagai data resource lokal sambil menunggu stasiun ukur IESR.'])}
 ${card('Ndao','RFP 1773 · pulau kecil · logsheet Jan–Okt 2026',[
  `Puncak ${f(pk.peak)} kW (${D.ndao[pkM].label}, ${HOUR(pk.pw[0])}) hanya ${f(C.ndao.dmp-pk.peak)} kW di bawah DMP ${f(C.ndao.dmp)} kW. Jika satu mesin ${f(C.ndao.mx)} kW lepas, sisa ${f(C.ndao.n1)} kW tidak cukup: <b>kriteria N-1 tidak terpenuhi</b>.`,
  `Siang 10–16 rata-rata ${f(N.day)} kW, malam 19–22 ${f(N.night)} kW. Kapasitas serap PLTS tanpa baterai hanya ±${f(HCV.ndao)} kWp (EBT ${pc(HCRE.ndao)}).`,
  `DMP hanya ${f(C.ndao.dmp/C.ndao.dt*100)}% dari daya terpasang ${f(C.ndao.dt)} kW; mesin sudah derating berat.`,
  `Puncak beberapa bulan tercatat dini hari (${oddM.join(', ')}); perlu dicek ke logsheet asli.`],
  ['Base case S2: 300 kWp + BESS 600 kWh / 200 kW. Simulasi memberi EBT ±48% dan diesel mati ±11 jam/hari, sekaligus menutup N-1.',
   'Isi November–Desember dengan profil Oktober dikali faktor pertumbuhan, dinyatakan sebagai asumsi.',
   'Verifikasi lahan PLTS saat kunjungan: koordinat, status tanah, jarak ke PLTD, risiko korosi pantai.',
   'Minta konsumsi BBM bulanan dan jam operasi tiap mesin untuk SFC nyata.'])}
 ${card('Raijua','Data lengkap, tetapi di luar lingkup RFP 1772',[
  `Puncak ${f(rjPk.peak)} kW (${rjPk.m}) <b>melampaui N-1 ${f(C.raijua.n1)} kW</b> (${rjOver.length} dari ${D.raijua.length} bulan); Juli ${f(D.raijua.find(m=>m.m==='JUL').peak)} kW hampir menyentuhnya. Oktober: puncak ${f(RJ.peak)} kW, ${f(RJ.energy)} kWh/hari.`,
  `${RJ.zeros} jam padam di Oktober, termasuk 3 Okt yang padam dua kali (03–06 dan 12–18). Hanya 4–5 dari 8 mesin yang dipakai; MAN 150 kW dan Deutz TCD 216 kW menyala setiap hari.`,
  `PLTS + baterai (inverter ${A.PVK.raijua} kW) memasok ${pc(MX.raijua.share.pv)} energi, sudah di batas serap tanpa baterai (±${f(HCV.raijua)} kWp). Tambahan PLTS hanya berguna bersama BESS yang lebih besar.`,
  'Logsheet mencatat DMP tiap mesin = 90% DT (total 1.182 kW), berbeda jauh dari data mesin (490 kW). Data mesin dipakai karena lebih konservatif.'],
  ['Ajukan Raijua sebagai site tambahan tertulis di inception report, dengan opsi dikerjakan ringan atau menjadi usulan kerja lanjutan.',
   'Jika disetujui: S2 400 kWp + BESS 600 kWh sebagai base case; nilai keandalan (jam padam yang dihindari) dihitung terpisah.',
   'Minta catatan gangguan dan penyebab padam Oktober, serta kapasitas baterai PLTS yang terpasang.',
   'Jika tidak disetujui, serahkan data ini ke IESR sebagai lampiran untuk FS berikutnya.'],'<span class="tag w">Di luar RFP</span>')}
 ${card('Semau','Data tambahan · di luar RFP',[
  `Puncak ${f(SM.peak)} kW (${SM.pw[1]+1} Okt, ${HOUR(SM.pw[0])}), ${f(SM.energy)} kWh/hari; ${C_SM.n} mesin, DMP ${f(C_SM.dmp)} kW, N-1 ${f(C_SM.n1)} kW: cadangan longgar.`,
  `PLTS on-grid ${A.PVK.semau} kW tertahan rata di ${f(A.PV.semau.top)} kW selama ${A.PV.semau.topN} jam; hanya ${pc(MX.semau.share.pv)} energi. Tanpa pembatas, PLTS yang sama memberi ±${f(A.simulate(A.SER.semau,{pv:450,bess:0}).re*100)}% EBT.`,
  `Beban siang terendah ${f(SM.dayMin)} kW: kapasitas serap tanpa baterai ±${f(HCV.semau)} kWp, sudah sama dengan yang terpasang.`],
  ['Cek ke ULP: mengapa keluaran PLTS Semau dibatasi 100 kW (setelan, inverter rusak, atau proteksi). Ini perbaikan berbiaya rendah.',
   'Jika IESR berminat, Semau bisa menjadi pembanding pulau kecil berbeban ±800 kW untuk model replikasi.'],'<span class="tag w">Di luar RFP</span>')}
 </div></section>
 <section class="sec grid g2">
  <div class="card"><h3>Prioritas 30 hari ke depan</h3><div class="steps" style="margin-top:8px">
   <div><i>1</i><span>Kirim inception report D1: metodologi, daftar data, asumsi, usulan tertulis soal Raijua; cantumkan bahwa langgam Rote dan Sabu sudah diterima.</span></div>
   <div><i>2</i><span>Surat permintaan data ke PLN UP3 Kupang: kontrak sewa BGP dan SPI, BBM bulanan per PLTD, langgam 12 bulan dan per penyulang, produksi + curtailment PLTS Eilode.</span></div>
   <div><i>3</i><span>Bangun profil 8.760 jam untuk HOMER: Rote dari Sep, Sabu dari Okt, Ndao dari Jan–Okt, dengan faktor musim yang dinyatakan terbuka.</span></div>
   <div><i>4</i><span>Jalankan simulator portal untuk short-list ukuran per sistem, lalu validasi 2–3 kandidat per sistem di HOMER Pro.</span></div>
   <div><i>5</i><span>Jadwalkan kunjungan lapangan Desember–Januari: Ba'a, Ndao, Seba, Eilode; cek pembatas PLTS dan survei lahan.</span></div>
   <div><i>6</i><span>Siapkan model keuangan (LCOE, NPV, IRR, payback) dengan biaya sewa sebagai biaya yang dihindari.</span></div></div></div>
  <div class="card"><h3>Risiko utama dan mitigasinya</h3><ul class="clean" style="margin-top:8px"><li><b>Satu bulan data untuk sistem besar.</b> September (Rote) dan Oktober (Sabu) bisa bukan bulan tipikal; sizing diberi rentang sampai data 12 bulan masuk.</li><li><b>Kontrak sewa tidak dibuka.</b> Pakai rentang tarif sewa publik yang dinyatakan sebagai asumsi; jalankan sensitivitas.</li><li><b>Lingkup melebar ke Raijua dan Semau.</b> Putuskan tertulis di inception: dikerjakan ringan atau menjadi usulan kerja lanjutan.</li><li><b>Kualitas logsheet.</b> DMP yang tidak konsisten, unit salah label, dan nilai sewa melebihi DMP dicatat dan dibersihkan dengan aturan terdokumentasi.</li></ul>
   <p class="note" style="margin-top:12px">Versi visual satu halaman dari insight ini tersedia di <a href="infografis.html">halaman infografis</a>, termasuk PNG untuk dibagikan.</p></div>
 </section>`}

/* ---------- SLD ---------- */
function vSld(){const s=SLDS[sel.sld];
 return `<div class="filters"><div class="seg" role="tablist">${SLDS.map((x,i)=>`<button role="tab" aria-pressed="${i===sel.sld}" data-sld="${i}">${x.k==='rote'?'Rote & Ndao':x.k==='sabu'?'Sabu':'Raijua'}</button>`).join('')}</div>
 <a class="btn" href="${s.pdf}" download><svg viewBox="0 0 24 24"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>Unduh PDF asli</a></div>
 <div class="sld"><div class="hd" style="margin:0"><div><h2>${s.t}</h2><span class="small mute">${s.sub}</span></div></div>
 <div class="frame" id="frame"><div class="zb"><button data-z="in" aria-label="Perbesar">+</button><button data-z="out" aria-label="Perkecil">−</button><button data-z="fit" aria-label="Pas layar">⤢</button></div><img id="sldimg" src="${s.img}" width="${s.w}" height="${s.h}" alt="${s.t}" draggable="false"></div>
 <p class="small mute">Gulir untuk zoom, seret untuk geser. Gambar dirender dari PDF pada 110 dpi; untuk detail label gardu gunakan PDF asli.</p>
 <div class="card"><h3>Yang terlihat di gambar ini</h3><ul class="clean" style="margin-top:8px">${s.pts.map(p=>`<li>${p}</li>`).join('')}</ul></div></div>`}
function sldInit(){const fr=$('#frame'),img=$('#sldimg');if(!fr)return;let k=1,tx=0,ty=0,drag=null;
 const apply=()=>{img.style.transform=`translate(${tx}px,${ty}px) scale(${k})`};
 const fit=()=>{const r=fr.getBoundingClientRect();k=Math.min(r.width/img.width,r.height/img.height);tx=(r.width-img.width*k)/2;ty=(r.height-img.height*k)/2;apply()};
 const zoom=(fac,cx,cy)=>{const r=fr.getBoundingClientRect(),px=cx-r.left,py=cy-r.top,nk=Math.max(.1,Math.min(6,k*fac));tx=px-(px-tx)*nk/k;ty=py-(py-ty)*nk/k;k=nk;apply()};
 if(img.complete)fit();else img.onload=fit;new ResizeObserver(fit).observe(fr);
 fr.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY)},{passive:false});
 fr.addEventListener('pointerdown',e=>{if(e.target.closest('.zb'))return;drag=[e.clientX-tx,e.clientY-ty];fr.classList.add('drag');fr.setPointerCapture(e.pointerId)});
 fr.addEventListener('pointermove',e=>{if(!drag)return;tx=e.clientX-drag[0];ty=e.clientY-drag[1];apply()});
 fr.addEventListener('pointerup',()=>{drag=null;fr.classList.remove('drag')});fr.addEventListener('pointercancel',()=>{drag=null;fr.classList.remove('drag')});
 fr.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{const r=fr.getBoundingClientRect(),c=[r.left+r.width/2,r.top+r.height/2];b.dataset.z==='fit'?fit():zoom(b.dataset.z==='in'?1.4:1/1.4,...c)})}

/* ---------- sumber ---------- */
function vSumber(){const F=[
 ['xls','Neraca-Daya-Rote-Sep-2026.xlsx','Neraca daya & langgam beban sistem Rote','2 lembar: LF Rote (per jam, 30 hari) · neraca daya harian PLTD Ba\'a + sewa BGP · Sep 2026 · 266 kB','baru'],
 ['xls','Langgam-Beban-Okt-2026-Seba-Raijua-Semau.xlsx','Langgam beban per unit PLTD Seba, Raijua, Semau','3 lembar, per unit per jam, 31 hari · Okt 2026 · 515 kB','baru'],
 ['pdf','SLD-Rote-Ndao-Jun-2026.pdf','Single Line ULP Rote Ndao','1 halaman · Visio · 12 Jun 2026 · 1,3 MB'],['pdf','SLD-Sabu-Raijua-Okt-2026.pdf','Single Line Diagram Sistem Sabu dan Raijua','2 halaman · Okt 2026 · 155 kB'],
 ['xls','Langgam-Beban-Ndao-2026.xlsx','Langgam beban PLTD Ndao','10 lembar (Jan–Okt 2026), beban per jam per tanggal · 59 kB'],['xls','Langgam-Beban-Raijua-2026.xlsx','Rekapitulasi beban puncak PLTD Raijua','6 lembar (Mei–Okt 2026), per unit pada hari tertinggi · 230 kB'],['xls','Data-Mesin-Ndao-Raijua-Seba.xlsx','Data mesin PLTD Ndao, Raijua dan Seba','3 lembar: merk, tipe, no. seri, DT/DMN/DMP · 12 kB']];
 return `<div class="grid g2"><div class="card"><h2>Berkas sumber</h2><p class="mute small" style="margin:4px 0 12px">Semua berkas asli dari PLN tersedia untuk diunduh. Nama berkas dirapikan, isi tidak diubah. Ekstraksi ke portal dilakukan oleh <code>tools/ekstrak_data_baru.py</code> di repositori.</p>
 <div class="files">${F.map(([t,fn,a,b,nw])=>`<a class="file" href="${t==='xls'?XLS:'data/'}${fn}" download style="text-decoration:none;color:inherit"><i class="${t}">${t.toUpperCase()}</i><span class="t"><b>${a}${nw?' <span class="tag sun">baru</span>':''}</b><span>${b}</span></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg></a>`).join('')}</div></div>
 <div class="grid" style="align-content:start"><div class="card"><h3>Catatan kualitas data</h3><ul class="clean" style="margin-top:8px">
  <li><b>Rote, LF Sep 2026:</b> tiga jam turun ke 2.412, 2.790 dan 3.386 kW (tgl 16, 2, 13) dibaca sebagai gangguan. Baris DT berisi salah ketik (23, 5.304, 5.433) dan diabaikan; kolom 31 kosong karena September 30 hari.</li>
  <li><b>Rote, neraca daya:</b> "unit terbesar" tertulis 800 kW, padahal unit Cummins Ba'a 1.000 kW. Lembar ini juga memuat blok PLTD Seba "Maret" yang kosong dan sejumlah angka lepas di kolom E dan AM; keduanya diabaikan.</li>
  <li><b>Sabu, Okt 2026:</b> diesel sewa SPI tercatat DT/DMN/DMP 1.500 kW tetapi keluaran sampai ${f(sewaSabu.max)} kW; MTU (…049) tercatat DMN 800 kW &gt; DT 528 kW; blok unit 13 kosong. DMP per unit di logsheet (total PLN 4.910 kW) berbeda dari data mesin Nov (3.665 kW); portal memakai data mesin.</li>
  <li><b>Raijua, Okt 2026:</b> blok unit 8 berlabel "PLTS" tetapi mesinnya Deutz BF6M1013EC (diesel), diperlakukan sebagai diesel. DMP tiap mesin ditulis 90% DT, tidak sama dengan data mesin.</li>
  <li><b>Semau, Okt 2026:</b> rekap tgl 18 pukul 24.00 tertulis 0 kW, padahal jumlah unit 269 kW; portal memakai jumlah unit. Rekap tgl 1 tidak berisi DT/MIN/AVE.</li>
  <li><b>Ndao, Maret 2026:</b> dua sel (tgl 12 pukul 03.00 = 454 kW, tgl 17 pukul 07.00 = 815 kW) melebihi daya mampu 280 kW; diabaikan dalam puncak dan rata-rata.</li>
  <li><b>Ndao:</b> banyak sel bernilai 0 pada siang hari menunjukkan padam atau tidak dicatat. Rata-rata dihitung tanpa sel 0; simulator mengisi jam padam dengan rata-rata jam bulan itu.</li>
  <li><b>Raijua, rekap Mei:</b> tanggal tertulis "11 Juni 2026" padahal judul lembar Mei. Kolom JUMLAH kadang tidak sama dengan penjumlahan unit; angka JUMLAH yang dipakai.</li>
  <li><b>Daya mampu Ndao:</b> SLD menulis 310 kW, data mesin menjumlah DMP 280 kW. Portal memakai 280 kW.</li>
  <li><b>Hitungan gardu/trafo:</b> dihitung otomatis dari label teks SLD; selisih beberapa unit terhadap daftar resmi PLN mungkin terjadi.</li></ul></div>
 <div class="card"><h3>Data yang masih ditunggu</h3><ul class="clean" style="margin-top:8px"><li>Kontrak sewa PLTD BGP (Rote) dan hybrid SPI (Sabu): kapasitas, tarif, masa berlaku</li><li>Langgam beban 12 bulan sistem Rote dan Sabu, dan per penyulang</li><li>Rincian unit dan BBM PLTD sewa BGP</li><li>Konsumsi BBM bulanan tiap PLTD</li><li>Produksi dan curtailment PLTS Eilode, Usulandu, Landuthi, Raerobo, Raijua, Semau</li><li>Penyebab pembatasan 100 kW PLTS Semau dan catatan padam Raijua</li><li>Data pelanggan dan penjualan kWh per sistem</li></ul></div>
 <div class="card"><h3>Istilah</h3><dl class="facts" style="margin-top:8px"><dt>DT</dt><dd>Daya terpasang (nameplate)</dd><dt>DMN</dt><dd>Daya mampu netto setelah derating</dd><dt>DMP</dt><dd>Daya mampu pasok yang bisa diandalkan</dd><dt>N-1</dt><dd>Daya mampu saat mesin terbesar lepas</dd><dt>N-2</dt><dd>Status neraca: cadangan cukup untuk dua unit terbesar lepas</dd><dt>Faktor beban</dt><dd>Beban rata-rata dibagi beban puncak</dd><dt>Kapasitas serap</dt><dd>kWp PLTS terbesar tanpa baterai dengan energi terbuang ≤ 5%</dd><dt>FCO / LBS / REC</dt><dd>Fuse cut out, load break switch, recloser</dd><dt>GH</dt><dd>Gardu hubung</dd></dl></div></div></div>`}

/* ---------- router & events ---------- */
const VF={ringkasan:vRingkasan,insight:vInsight,sistem:vSistem,beban:vBeban,simulator:vSim,sld:vSld,sumber:vSumber};
function route(){const v=location.hash.slice(1).split('?')[0];return VIEWS.some(x=>x[0]===v)?v:'ringkasan'}
function bindCharts(root){root.querySelectorAll('.chart').forEach(ch=>{const t=tipInit(ch);
 ch.addEventListener('pointermove',e=>{const h=e.target.closest('[data-tip]');if(h){showTip(t,ch,e.clientX,e.clientY,h.dataset.tip)}else if(!e.target.closest('[data-curve-hit]'))hideTip(t)});
 ch.addEventListener('pointerleave',()=>{hideTip(t);const c=ch.querySelector('.cross');if(c)c.style.display='none'});
 const hit=ch.querySelector('[data-curve-hit]');if(hit){const {s,mx}=CURV[hit.dataset.curveHit],svg=ch.querySelector('svg'),cross=ch.querySelector('.cross'),W=680,H=250,L=46,Tp=14,B=30;
  hit.addEventListener('pointermove',e=>{const r=hit.getBoundingClientRect(),h=Math.max(0,Math.min(23,Math.round((e.clientX-r.left)/r.width*23))),x=L+h/23*(W-L-12),y=Tp+(H-Tp-B)-s.avg[h]/mx*(H-Tp-B);
   cross.style.display='';cross.querySelector('line').setAttribute('x1',x);cross.querySelector('line').setAttribute('x2',x);cross.querySelector('circle').setAttribute('cx',x);cross.querySelector('circle').setAttribute('cy',y);
   const sr=svg.getBoundingClientRect(),px=sr.left+x/W*sr.width,py=sr.top+y/H*sr.height;showTip(t,ch,px,py,`<b>${HOUR(h)}</b><br>rata-rata ${f(s.avg[h])} kW<br>min ${f(s.mn[h])} · maks ${f(s.mx[h])} kW`)})}})}
function render(keep){const v=route();$('#nav').innerHTML=VIEWS.map(([k,l])=>`<a href="#${k}"${k===v?' aria-current="page"':''}>${l}</a>`).join('')+'<a href="infografis.html">Infografis</a>';
 const y=scrollY,app=$('#app');for(const k in CURV)delete CURV[k];app.innerHTML=`<div class="view on">${VF[v]()}</div>`;document.title=(v==='ringkasan'?'':VIEWS.find(x=>x[0]===v)[1]+' · ')+'Data Sistem Rote Ndao & Sabu Raijua';
 bindCharts(app);sldInit();window.scrollTo({top:keep?y:0})}
function simUpdate(){const o=$('#simout');if(!o)return;o.innerHTML=simOut();bindCharts(o);
 document.querySelectorAll('[data-sim]').forEach(i=>{const k=i.dataset.sim;if(+i.value!==SIM[k])i.value=SIM[k];const out=$('#o-'+k);if(out)out.textContent=out.textContent.replace(/^[\d.,]+/,f(SIM[k],k==='yld'||k==='sfc'?2:0))});
 document.querySelectorAll('.presets [data-sc]').forEach(b=>b.classList.toggle('pri',b.dataset.sc===SIM.sc))}
document.addEventListener('input',e=>{const k=e.target.dataset.sim;if(!k)return;SIM[k]=+e.target.value;SIM.sc=null;if(k==='pv')SIM.clip=undefined;if(k==='bess'&&SIM.bess>0&&SIM.bkw===0)SIM.bkw=Math.round(SIM.bess/3);if(k==='bess'&&SIM.bess===0)SIM.bkw=0;simUpdate()});
document.addEventListener('click',e=>{const b=e.target.closest('button,a.chip,a[data-lg]');if(!b)return;
 if(b.dataset.simgo){simPreset(b.dataset.simgo,b.dataset.sc);location.hash='simulator';return}
 if(b.dataset.sys!==undefined&&b.dataset.go){sel.sys=b.dataset.sys;location.hash='sistem';return}
 if(b.dataset.sys!==undefined){sel.sys=b.dataset.sys;render(1);return}
 if(b.dataset.lg!==undefined){sel.lg=b.dataset.lg;if(b.tagName==='A'){if(location.hash==='#beban')render();return}render(1);return}
 if(b.dataset.simk!==undefined){simPreset(b.dataset.simk,'S2');render(1);return}
 if(b.dataset.sc!==undefined&&b.closest('.presets')){simPreset(SIM.k,b.dataset.sc);render(1);return}
 if(b.dataset.nd!==undefined){sel.ndao=+b.dataset.nd;render(1);return}
 if(b.dataset.rj!==undefined){sel.raijua=+b.dataset.rj;render(1);return}
 if(b.dataset.sld!==undefined){sel.sld=+b.dataset.sld;render(1);return}});
$('#tog').onclick=()=>{const r=document.documentElement,cur=r.dataset.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),nx=cur==='dark'?'light':'dark';r.dataset.theme=nx;try{localStorage.setItem('theme',nx)}catch(e){}};
try{const t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}
simPreset('ndao','S2');
window.addEventListener('hashchange',()=>render());render();
}
