#!/usr/bin/env bash
set -euo pipefail

SSH_KEY="${SSH_KEY:-~/.ssh/id_terraform}"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no"
VM_USER="azureuser"
VM_IP=$(terraform -chdir=terraform output -raw public_ip)

MYSQL_FQDN=$(terraform -chdir=terraform output -raw mysql_fqdn)
STORAGE_ACCOUNT=$(terraform -chdir=terraform output -raw storage_account_name)
STORAGE_CONTAINER=$(terraform -chdir=terraform output -raw storage_container_name)
IDENTITY_CLIENT_ID=$(terraform -chdir=terraform output -raw managed_identity_client_id)
MYSQL_USER=$(grep mysql_admin_username terraform/terraform.tfvars | cut -d'"' -f2)
MYSQL_PASS=$(grep mysql_admin_password terraform/terraform.tfvars | cut -d'"' -f2)
JWT_SECRET=$(grep jwt_secret terraform/terraform.tfvars | cut -d'"' -f2)

REMOTE_API="/opt/cloud-project"
REMOTE_FRONTEND="/var/www/html"

echo "==> Deploiement ${VM_USER}@${VM_IP}"

# Upload API source
echo "==> Uploading API source..."
ssh $SSH_OPTS "${VM_USER}@${VM_IP}" "rm -rf ${REMOTE_API}/src ${REMOTE_API}/dist ${REMOTE_API}/drizzle"
scp $SSH_OPTS -r \
  apps/api/src \
  apps/api/drizzle \
  apps/api/drizzle.config.ts \
  apps/api/package.json \
  apps/api/pnpm-lock.yaml \
  apps/api/tsconfig.json \
  "${VM_USER}@${VM_IP}:${REMOTE_API}/"

# Generate .env
echo "==> Generation .env..."
ssh $SSH_OPTS "${VM_USER}@${VM_IP}" "cat > ${REMOTE_API}/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_FQDN}/projetcloud?ssl={}
JWT_SECRET=${JWT_SECRET}
AZURE_STORAGE_ACCOUNT=${STORAGE_ACCOUNT}
AZURE_STORAGE_CONTAINER=${STORAGE_CONTAINER}
AZURE_CLIENT_ID=${IDENTITY_CLIENT_ID}
EOF"

# Install, build, migration on VM
echo "==> Install + build + migrate sur la VM..."
ssh $SSH_OPTS "${VM_USER}@${VM_IP}" "cd ${REMOTE_API} && \
  pnpm install --frozen-lockfile && \
  pnpm run build && \
  pnpm run db:migrate"

# Build & upload frontend (static, built locally)
echo "==> Build Frontend..."
(cd apps/app && pnpm install --frozen-lockfile && pnpm run build)

echo "==> Upload Frontend..."
ssh $SSH_OPTS "${VM_USER}@${VM_IP}" "sudo rm -rf ${REMOTE_FRONTEND}/*"
scp $SSH_OPTS -r apps/app/dist/. "${VM_USER}@${VM_IP}:${REMOTE_FRONTEND}/"

# Restart
echo "==> Restart services..."
ssh $SSH_OPTS "${VM_USER}@${VM_IP}" \
  "sudo systemctl daemon-reload && sudo systemctl enable --now nodeapp && sudo systemctl restart nodeapp"

echo "==> http://${VM_IP}"