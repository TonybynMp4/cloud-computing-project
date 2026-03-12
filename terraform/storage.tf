# Storage Account + Blob Container

resource "azurerm_storage_account" "storage" {
  name                     = "stprojetcloud"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  allow_nested_items_to_be_public = false
}

resource "azurerm_storage_container" "files" {
  name                  = "user-files"
  storage_account_id    = azurerm_storage_account.storage.id
  container_access_type = "private"
}
