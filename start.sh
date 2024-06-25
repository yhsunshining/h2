#!/bin/sh

echo -e "\n=========================================================" >> benchmark.log

for i in $(seq 1 150)
do
  SEQ=$i && node index.js --s=$i &
  # echo $i
done
node index.js --s=0
