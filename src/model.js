/* CoopCrédito IA - experimento didáctico, no destinado a decisiones reales.
   Modelo genuino de regresión logística entrenado con registros 100% sintéticos.
   No recopila ni transmite datos; el cálculo ocurre en el navegador. */
(function(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CoopModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  const VERSION = 'LAB-0.1';
  const FEATURE_NAMES = ['Ingreso mensual', 'Endeudamiento', 'Atrasos', 'Antigüedad laboral', 'Monto solicitado'];
  function rngFactory(seed) { let v=seed>>>0; return () => ((v=(1664525*v+1013904223)>>>0)/4294967296); }
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  function featurize(d) {return [1, Number(d.ingreso)/4000, Number(d.deuda)/100, Number(d.atrasos)/6, Number(d.antiguedad)/120, Number(d.monto)/15000];}
  function sigmoid(z){return 1/(1+Math.exp(-clamp(z,-30,30)));}
  function generateData(count=360, seed=20261124){
    const r=rngFactory(seed), out=[];
    for(let i=0;i<count;i++) {
      const d={ingreso:Math.round(350+r()*4250),deuda:Math.round(5+r()*86),atrasos:Math.floor(r()*7),antiguedad:Math.round(1+r()*119),monto:Math.round(500+r()*14500)};
      const x=featurize(d);
      const latent=-1.2-1.0*x[1]+2.4*x[2]+1.25*x[3]-0.85*x[4]+0.65*x[5];
      out.push({...d, incumplio:r()<sigmoid(latent)?1:0});
    }
    return out;
  }
  function train(samples, epochs=500, rate=0.8){
    let w=[0,0,0,0,0,0];
    for(let e=0;e<epochs;e++) {
      const grad=[0,0,0,0,0,0];
      for(const s of samples) {
        const x=featurize(s), p=sigmoid(w.reduce((z,v,j)=>z+v*x[j],0));
        for(let j=0;j<w.length;j++) grad[j]+=(p-s.incumplio)*x[j];
      }
      for(let j=0;j<w.length;j++) w[j]-=rate*grad[j]/samples.length;
    }
    return {version:VERSION, weights:w, trainSize:samples.length};
  }
  function predict(model, data) {
    const x=featurize(data);
    const contributions=model.weights.map((w,i)=>w*x[i]);
    const probability=sigmoid(contributions.reduce((a,b)=>a+b,0));
    return {probability, classification:probability>=0.55?'ALTO':(probability>=0.28?'MODERADO':'BAJO'), contributions};
  }
  function evaluate(model, data, threshold=0.5){
    let tp=0,tn=0,fp=0,fn=0;
    for(const s of data){ const y=predict(model,s).probability>=threshold?1:0;
      if(y===1 && s.incumplio===1)tp++; else if(y===0 && s.incumplio===0)tn++; else if(y===1)fp++; else fn++;
    }
    const div=(a,b)=>b? a/b:0;
    return {tp,tn,fp,fn,n:data.length,accuracy:div(tp+tn,data.length),precision:div(tp,tp+fp),recall:div(tp,tp+fn)};
  }
  function createDemo(){const a=generateData();return {model:train(a.slice(0,240)),holdout:a.slice(240)};}
  return {VERSION,FEATURE_NAMES,generateData,train,predict,evaluate,createDemo};
});
