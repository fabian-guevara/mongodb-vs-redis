
# ycsb-comparo (Cloud)
Compara Atlas vs Redis Cloud usando YCSB. Scripts envían TLS a Redis Cloud (`-p redis.ssl=true`).

## Quick
```bash
chmod +x ycsb-mongo.sh ycsb-redis.sh
# Mongo
./ycsb-mongo.sh load C 100000 64 "mongodb+srv://USER:PASS@CLUSTER/?retryWrites=true&w=majority"
./ycsb-mongo.sh run  C 120    128 "mongodb+srv://USER:PASS@CLUSTER/?retryWrites=true&w=majority" 20000
# Redis Cloud
./ycsb-redis.sh load C 100000 64 -p redis.host=<HOST> -p redis.port=<PORT> -p redis.password=<PASSWORD> -p redis.ssl=true
./ycsb-redis.sh run  C 120    128 -p redis.host=<HOST> -p redis.port=<PORT> -p redis.password=<PASSWORD> -p redis.ssl=true -p target=20000
```
