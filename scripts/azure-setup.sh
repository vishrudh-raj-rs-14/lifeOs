#!/usr/bin/env bash
# ============================================================
# LifeOS — Azure VM Setup Script
# Run this once from your local machine after: az login
# Usage: bash scripts/azure-setup.sh
# ============================================================
set -euo pipefail

# ── Config (edit these) ─────────────────────────────────────
RG="lifeos-rg"
LOCATION="eastus"
VM_NAME="lifeos-vm"
VM_SIZE="Standard_B2s"     # 2 vCPU, 4 GB RAM — free tier eligible
OS_IMAGE="Ubuntu2204"
ADMIN_USER="lifeos"
SSH_KEY_PATH="$HOME/.ssh/lifeos_vm"
DNS_LABEL="lifeos"         # → lifeos.eastus.cloudapp.azure.com (optional)
# ────────────────────────────────────────────────────────────

echo "=== LifeOS Azure VM Setup ==="
echo "Resource group : $RG"
echo "Location       : $LOCATION"
echo "VM name        : $VM_NAME"
echo "VM size        : $VM_SIZE"
echo ""

# 1. Generate SSH key if it doesn't exist
if [ ! -f "$SSH_KEY_PATH" ]; then
  echo "→ Generating SSH key at $SSH_KEY_PATH ..."
  ssh-keygen -t ed25519 -f "$SSH_KEY_PATH" -N "" -C "lifeos-vm"
fi

# 2. Create resource group
echo "→ Creating resource group '$RG' in '$LOCATION' ..."
az group create --name "$RG" --location "$LOCATION" --output table

# 3. Create VM
echo "→ Creating VM '$VM_NAME' (this takes ~2 min) ..."
az vm create \
  --resource-group "$RG" \
  --name "$VM_NAME" \
  --image "$OS_IMAGE" \
  --size "$VM_SIZE" \
  --admin-username "$ADMIN_USER" \
  --ssh-key-values "${SSH_KEY_PATH}.pub" \
  --public-ip-sku Standard \
  --public-ip-address-dns-name "$DNS_LABEL" \
  --output table

# 4. Open ports
echo "→ Opening ports 22 (SSH), 80 (HTTP), 443 (HTTPS) ..."
az vm open-port --resource-group "$RG" --name "$VM_NAME" --port 22  --priority 1000
az vm open-port --resource-group "$RG" --name "$VM_NAME" --port 80  --priority 1001
az vm open-port --resource-group "$RG" --name "$VM_NAME" --port 443 --priority 1002

# 5. Get public IP
PUBLIC_IP=$(az vm show -d --resource-group "$RG" --name "$VM_NAME" --query publicIps -o tsv)
echo ""
echo "=============================================="
echo "✓ VM is ready!"
echo "  Public IP  : $PUBLIC_IP"
echo "  SSH        : ssh -i $SSH_KEY_PATH $ADMIN_USER@$PUBLIC_IP"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Point DNS: lifeos.vishrudh.tech → $PUBLIC_IP (A record)"
echo "  2. SSH into VM and run the bootstrap script:"
echo "       ssh -i $SSH_KEY_PATH $ADMIN_USER@$PUBLIC_IP"
echo "       curl -fsSL https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/scripts/vm-bootstrap.sh | bash"
echo ""
echo "  3. Add these GitHub Actions secrets:"
echo "       VM_HOST     = $PUBLIC_IP"
echo "       VM_USER     = $ADMIN_USER"
echo "       VM_SSH_KEY  = (contents of $SSH_KEY_PATH)"
echo ""

# Save connection info
cat > .vm-info << EOF
VM_HOST=$PUBLIC_IP
VM_USER=$ADMIN_USER
SSH_KEY=$SSH_KEY_PATH
EOF
echo "→ Saved VM info to .vm-info"
