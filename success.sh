echo "Compilation Successful!"

node \
  -r source-map-support/register typescript/index \
  --inspect=0.0.0.0:9232 typescript/index