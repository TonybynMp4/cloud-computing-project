output "public_ip" {
  description = "Public IP address of the VM"
  value       = azurerm_public_ip.pip.ip_address
}

output "mysql_fqdn" {
  description = "FQDN of the MySQL Flexible Server"
  value       = azurerm_mysql_flexible_server.mysql.fqdn
}

output "storage_account_name" {
  description = "Name of the Storage Account"
  value       = azurerm_storage_account.storage.name
}

output "storage_container_name" {
  description = "Name of the Blob container"
  value       = azurerm_storage_container.files.name
}

output "managed_identity_client_id" {
  description = "Client ID of the VM managed identity"
  value       = azurerm_user_assigned_identity.vm.client_id
}
