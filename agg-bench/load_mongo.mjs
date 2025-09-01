import fs from 'fs'; import readline from 'readline'; import { MongoClient } from 'mongodb';
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.startsWith('--')?s.replace(/^--/,'').split('='):[s,true])); const uri=process.argv[2];
if(!uri){ console.error('Usage: node load_mongo.mjs <MongoURI> --file data.ndjson --db bench --coll events'); process.exit(1); }
const file=args.file||'data.ndjson', dbName=args.db||'bench', collName=args.coll||'events', batch=parseInt(args.batch||'2000',10);
const client=new MongoClient(uri); await client.connect(); const coll=client.db(dbName).collection(collName); try{await coll.drop();}catch{}
const rl=readline.createInterface({input:fs.createReadStream(file)}); let buf=[],tot=0;
for await (const line of rl){ if(!line.trim()) continue; buf.push(JSON.parse(line)); if(buf.length>=batch){ await coll.insertMany(buf,{ordered:false}); tot+=buf.length; console.log('inserted',tot); buf=[]; } }
if(buf.length){ await coll.insertMany(buf,{ordered:false}); tot+=buf.length; } console.log('Done. Inserted',tot);
await coll.createIndexes([{key:{event:1,ts:-1}},{key:{region:1}},{key:{'items.sku':1}},{key:{tags:1}},{key:{ts:-1}}]); console.log('Indexes created.'); await client.close();