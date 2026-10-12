// FIT AI v1 — key and access code are server-side environment variables only.
const attempts = new Map(); // best-effort per warm function instance; not a distributed rate limiter
const schema = {type:'object',additionalProperties:false,required:['name','desc','groups','ex'],properties:{
 name:{type:'string'},desc:{type:'string'},
 groups:{type:'array',minItems:2,maxItems:5,items:{type:'array',items:{anyOf:[{type:'string'},{type:'integer'}]},minItems:3,maxItems:3}},
 ex:{type:'array',minItems:4,maxItems:12,items:{type:'array',items:{anyOf:[{type:'string'},{type:'integer'}]},minItems:4,maxItems:4}}
}};
const json = (body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async function handler(req){
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const secret=process.env.FIT_ACCESS_CODE;
 if(!secret || secret.length<12)return json({error:'Set FIT_ACCESS_CODE (at least 12 characters) in Netlify environment variables before using AI.'},503);
 const supplied=req.headers.get('X-FIT-Code')||'';
 // timing-safe comparison on supported Netlify Node runtime
 const {timingSafeEqual}=await import('node:crypto');
 const a=Buffer.from(supplied),b=Buffer.from(secret);
 if(a.length!==b.length||!timingSafeEqual(a,b))return json({error:'Incorrect FIT access code.'},401);
 const ip=(req.headers.get('x-nf-client-connection-ip')||'local').slice(0,90);const now=Date.now();const recent=(attempts.get(ip)||[]).filter(t=>now-t<3600000);
 if(recent.length>=8)return json({error:'AI request limit reached. Try again in an hour.'},429);
 recent.push(now);attempts.set(ip,recent);
 let data;try{data=await req.json()}catch{return json({error:'Invalid request'},400)}
 const goal=String(data.goal||'').slice(0,260),request=String(data.request||'').trim().slice(0,240),history=JSON.stringify(data.history||[]).slice(0,3800);
 if(!request)return json({error:'Enter a workout request.'},400);
 const key=process.env.OPENAI_API_KEY;if(!key)return json({error:'OPENAI_API_KEY is missing on the server.'},503);
 const prompt=`You are FIT, a concise, conservative strength coach. User: ${goal}. Today's request: ${request}. Recent lifted numbers (lb per dumbbell when applicable): ${history}. Produce an efficient workout matching equipment/time. Prefer compound movements then accessories; balanced pulling and legs across weekly workouts. Avoid exercising painfully sore/injured regions, and don't diagnose. Choose manageable volume and rest. Exercise array each item [exercise name, integer sets 1-4, rep range e.g. '8–12' or '45 sec', cue <=55 chars]. Groups array each item [heading, estimated time e.g. '12 min', number of exercises in group]. Group exercise counts MUST sum exactly to ex length. Do not fabricate historically lifted weights. Make 4–9 exercises and about 30–45 minutes unless request differs. Minimize words. JSON only.`;
 try{
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-nano',temperature:0.3,max_completion_tokens:1300,messages:[{role:'system',content:'Return only valid JSON with fields name,desc,groups,ex. Prioritize safety, concise workout prescriptions. No markdown.'},{role:'user',content:prompt}],response_format:{type:'json_object'}}),signal:AbortSignal.timeout(17000)});
  const result=await r.json();if(!r.ok)return json({error:r.status===429?'AI quota or rate limit reached. Try later.':'AI service unavailable. Check Netlify logs and API billing.'},502);
  const w=JSON.parse(result.choices?.[0]?.message?.content||'{}');
  if(typeof w.name!=='string'||!Array.isArray(w.ex)||w.ex.length<4||w.ex.length>12||!Array.isArray(w.groups)||w.groups.reduce((sum,g)=>sum+Number(g?.[2]||0),0)!==w.ex.length||w.ex.some(x=>!Array.isArray(x)||x.length!==4||!Number.isInteger(x[1])||x[1]<1||x[1]>5))return json({error:'Workout format invalid. Please retry.'},502);
  return json({workout:{label:'AI WORKOUT',name:w.name.slice(0,75),desc:String(w.desc||'Custom workout').slice(0,120),groups:w.groups,ex:w.ex}})
 }catch{return json({error:'Unable to generate workout right now. Try again.'},502)}
}
export const config={path:'/.netlify/functions/workout'};
