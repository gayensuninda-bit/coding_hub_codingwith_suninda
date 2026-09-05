// Coding Hub compiler gateway
// Node 18+
// Set JUDGE0_URL to your Judge0 CE instance.
// Example: https://your-judge0-server.example.com
const express=require("express"),cors=require("cors");
const app=express();app.use(cors());app.use(express.json({limit:"1mb"}));
const PORT=process.env.PORT||3000;
const JUDGE0_URL=(process.env.JUDGE0_URL||"").replace(/\/$/,"");
const ids={c:50,cpp:54,java:62,python:71,javascript:63,typescript:74,csharp:51,go:60,rust:73,php:68,ruby:72,kotlin:78,swift:83,sql:82,html:89,bash:46,dart:92,clojure:86,haskell:61,lua:26};
app.get("/health",(req,res)=>res.json({ok:true,judge0Configured:!!JUDGE0_URL}));
app.post("/execute",async(req,res)=>{
 try{
  if(!JUDGE0_URL)return res.status(503).json({error:"JUDGE0_URL is not configured on the server."});
  const {language,code}=req.body||{};
  if(!ids[language])return res.status(400).json({error:"Unsupported language."});
  if(typeof code!=="string"||code.length>100000)return res.status(400).json({error:"Invalid code."});
  const submit=await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({language_id:ids[language],source_code:code})
  });
  const data=await submit.json();
  if(!submit.ok)return res.status(submit.status).json({error:data.message||"Judge0 error",details:data});
  const output=[data.stdout,data.stderr,data.compile_output].filter(Boolean).join("\\n");
  res.json({output:output||"(No output)",status:data.status?.description||"Finished"});
 }catch(e){res.status(500).json({error:e.message})}
});
app.listen(PORT,()=>console.log(`Coding Hub compiler gateway running on :${PORT}`));
