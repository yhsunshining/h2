#!/bin/sh

echo -e "\n=========================================================" >> benchmark.log

for i in $(seq 1 100)
do
  SEQ=$i && node index.js --s=$i &
  # echo $i
done
node index.js --s=0
