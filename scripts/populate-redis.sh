#!/bin/sh
redis-cli -h localhost -p 6379 SET scooter-1 '{"id":"scooter-1","status":"available","lat":4.605,"lng":-74.075}'
redis-cli -h localhost -p 6379 SET scooter-2 '{"id":"scooter-2","status":"available","lat":4.608,"lng":-74.072}'
redis-cli -h localhost -p 6379 SET scooter-3 '{"id":"scooter-3","status":"available","lat":4.607,"lng":-74.073}'
redis-cli -h localhost -p 6379 SET scooter-4 '{"id":"scooter-4","status":"available","lat":4.603,"lng":-74.076}'
echo "Scooters precargados en Redis"
