const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export function solve(matrix,vector){
 const a=matrix.map((row,i)=>[...row,vector[i]]),n=a.length;
 for(let k=0;k<n;k++){
  let p=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[p][k]))p=i;
  if(Math.abs(a[p][k])<1e-9)return null;
  [a[k],a[p]]=[a[p],a[k]];const divisor=a[k][k];for(let j=k;j<=n;j++)a[k][j]/=divisor;
  for(let i=0;i<n;i++)if(i!==k){const factor=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=factor*a[k][j];}
 }
 return a.map(row=>row[n]);
}
export function moments(row){
 const sum=key=>Number(row?.['sum_'+key]||0),n=Number(row?.count||0);
 return {n,x:[sum('x1'),sum('x2'),sum('x3')],y:sum('y'),yy:sum('yy'),xy:[sum('xy1'),sum('xy2'),sum('xy3')],xx:[[sum('xx11'),sum('xx12'),sum('xx13')],[sum('xx12'),sum('xx22'),sum('xx23')],[sum('xx13'),sum('xx23'),sum('xx33')]],t:sum('t'),tt:sum('tt'),ty:sum('ty')};
}
export function evaluate(model,m){
 if(!m.n)return {n:0,rmse:null,r2:null};
 const b=model.coefficients,a=model.intercept;
 const sse=Math.max(0,m.yy-2*a*m.y-2*dot(b,m.xy)+m.n*a*a+2*a*dot(b,m.x)+b.reduce((s,v,i)=>s+v*dot(b,m.xx[i]),0));
 const sst=Math.max(0,m.yy-m.y*m.y/m.n);
 return {n:m.n,rmse:Math.sqrt(sse/m.n),r2:sst>1e-10?1-sse/sst:null};
}
export function fitRegression(trainRow,validationRow){
 const m=moments(trainRow),validation=moments(validationRow),base={n:m.n,validation_n:validation.n,status:'insufficient',minimum:8};
 if(m.n<8)return base;
 const means=m.x.map(x=>x/m.n),meanY=m.y/m.n,cov=m.xx.map((row,i)=>row.map((x,j)=>x-m.x[i]*m.x[j]/m.n));
 const scales=cov.map((row,i)=>Math.sqrt(Math.max(0,row[i]/(m.n-1)))),used=[],dropped=[];
 const corr=cov.map((row,i)=>row.map((v,j)=>scales[i]&&scales[j]?v/((m.n-1)*scales[i]*scales[j]):0));
 for(let i=0;i<3;i++){
  if(scales[i]<1e-8){dropped.push(i);continue;}
  const cross=used.map(j=>corr[i][j]),prior=used.length?solve(used.map(j=>used.map(k=>corr[j][k])),cross):[];
  if(prior===null||1-dot(cross,prior)<1e-7)dropped.push(i);else used.push(i);
 }
 if(!used.length)return {...base,status:'constant_inputs',means,mean_y:meanY,dropped};
 const standardized=solve(used.map(i=>used.map(j=>corr[i][j])),used.map(i=>(m.xy[i]-m.x[i]*meanY)/((m.n-1)*scales[i])));
 if(!standardized)return {...base,status:'singular'};
 const coefficients=[0,0,0];used.forEach((i,k)=>{coefficients[i]=standardized[k]/scales[i];});
 const model={...base,status:'ready',means,scales,mean_y:meanY,coefficients,intercept:meanY-dot(coefficients,means),dropped,effects:coefficients.map((b,i)=>b*scales[i])};
 model.training=evaluate(model,m);model.validation=validation.n>=3?evaluate(model,validation):{n:validation.n,rmse:null,r2:null};
 const variance=m.tt-m.t*m.t/m.n;
 if(variance>1e-8){const slope=(m.ty-m.t*m.y/m.n)/variance,intercept=meanY-slope*m.t/m.n;model.trend={slope,intercept,mean_t:m.t/m.n};}
 model.flat_target=m.yy-m.y*m.y/m.n<1e-10;
 return model;
}
export function predict(model,values){return model.intercept+dot(model.coefficients,values);}
export function guidanceFor(model,catalog,metric){
 if(model.status!=='ready')return 'Not enough varied observations to recommend a behavior change. Collect more completed outcomes.';
 const factors=catalog.features.map((f,i)=>({label:f.label,effect:model.effects[i],dropped:model.dropped.includes(i)})).filter(f=>!f.dropped).sort((a,b)=>Math.abs(b.effect)-Math.abs(a.effect));
 const supported=model.validation.n>=3&&model.validation.r2!==null&&model.validation.r2>0&&!model.flat_target;
 return `${catalog.title}, target ${metric}. OLS fitted to ${model.n} training observations; ${model.validation.n} grouped holdout observations. ${supported?'Holdout R² is positive, but this remains exploratory.':'No positive, usable holdout evidence yet; do not treat this fit as a reliable improvement rule.'} ${factors.map(f=>`${f.label}: a one-training-standard-deviation increase is associated with ${f.effect>=0?'+':''}${f.effect.toPrecision(4)} target units, holding other included inputs fixed.`).join(' ')} Treat associations as hypotheses for a small, human-approved next experiment, never causal proof, automatic optimization, or model-weight training. ${catalog.note}`;
}