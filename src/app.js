/* Prototipo didáctico: se han omitido controles intencionalmente para el ejercicio.
   NO contiene autenticación, control centralizado ni validación robusta del formulario. */
(function(){
 'use strict';
 const $=(id)=>document.getElementById(id);
 const demo=CoopModel.createDemo(), model=demo.model, metrics=CoopModel.evaluate(model,demo.holdout);
 const fmt=(x)=>Number(x).toFixed(1)+'%';
 $('version').textContent=CoopModel.VERSION;
 $('accuracy').textContent=fmt(metrics.accuracy*100);
 $('recall').textContent=fmt(metrics.recall*100);
 $('samples').textContent=metrics.n+' registros de prueba';
 $('matrix').textContent=`VP: ${metrics.tp} · VN: ${metrics.tn} · FP: ${metrics.fp} · FN: ${metrics.fn}`;
 const KEY='coocreditoia_lab_historial';
 const getLog=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return [];}};
 const setLog=(rows)=>localStorage.setItem(KEY,JSON.stringify(rows));
 function safe(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function renderLog(){
   const rows=getLog().slice().reverse();
   $('count').textContent=rows.length;
   $('history').innerHTML=rows.length? rows.map(r=>`<tr><td>${safe(r.folio)}</td><td>${safe(r.fecha)}</td><td>${Number(r.probabilidad*100).toFixed(1)}%</td><td>${safe(r.clasificacion)}</td><td class="missing">No registrado</td></tr>`).join('') : '<tr><td colspan="5" class="empty">Sin evaluaciones todavía</td></tr>';
 }
 $('credit-form').addEventListener('submit',e=>{
   e.preventDefault();
   // DELIBERADAMENTE: validación insuficiente; se debe identificar y corregir en el taller.
   const data={ingreso:Number($('ingreso').value), deuda:Number($('deuda').value), atrasos:Number($('atrasos').value), antiguedad:Number($('antiguedad').value), monto:Number($('monto').value)};
   const errores = [];

   if (data.ingreso <= 0 || !Number.isFinite(data.ingreso)) {
     errores.push("El ingreso debe ser mayor que 0.");
   }
   
   if (data.monto <= 0 || !Number.isFinite(data.monto)) {
     errores.push("El monto debe ser mayor que 0.");
   }
   
   if (data.deuda < 0 || data.deuda > 100) {
     errores.push("El endeudamiento debe estar entre 0 y 100%.");
   }
   
   if (!Number.isInteger(data.atrasos) ||
       data.atrasos < 0 || data.atrasos > 12) {
     errores.push("Los atrasos deben estar entre 0 y 12.");
   }

   if (errores.length > 0) {
     $('result').hidden = true;
     alert("Corrige estos errores:\n" + errores.join("\n"));
     return;
   }
    const result=CoopModel.predict(model,data);
   $('result').hidden=false;
   $('risk').textContent=result.classification;
   $('risk').className='risk '+result.classification.toLowerCase();
   $('prob').textContent=fmt(result.probability*100);
   $('bar').style.width=fmt(result.probability*100);
   $('reason').textContent='Estimación estadística: NO es una aprobación ni un rechazo de crédito. La decisión requiere políticas y revisión humana.';
   const sorted=result.contributions.slice(1).map((v,i)=>({feature:CoopModel.FEATURE_NAMES[i],value:v})).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value));
   $('contrib').innerHTML=sorted.map(x=>`<li><span>${safe(x.feature)}</span><strong>${x.value>=0?'+':''}${x.value.toFixed(2)}</strong></li>`).join('');
   const record={folio:'LAB-'+String(Date.now()).slice(-7), fecha:new Date().toLocaleString('es-EC'),probabilidad:result.probability,clasificacion:result.classification,entradas:data};
   // DELIBERADAMENTE: no guarda version del modelo ni identidad de revisor.
   setLog(getLog().concat(record)); renderLog();
 });
 $('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({tipo:'DATOS FICTICIOS - LABORATORIO',eventos:getLog()},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='evidencia_coopcreditoia.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 $('clear').addEventListener('click',()=>{if(confirm('¿Eliminar las evaluaciones de ESTE navegador? No se puede revertir.')){localStorage.removeItem(KEY);renderLog();}});
 renderLog();
})();
