# Projet Cloud Computing

## Description

Frontend & backend simple d'upload de fichiers, avec stockage sur Azure Blob Storage et base de données Azure MySQL.

- authentification
- upload de fichiers
- liste des fichiers uploadés par l'utilisateur
- suppression de fichiers
- preview de fichiers (images/videos/PDF)

## Installation

1. Cloner le repo: `git clone https://github.com/TonybynMp4/cloud-computing-project`
2. `terraform init && terraform apply` dans le dossier `terraform/`
3. `./deploy.sh` depuis la racine pour déployer l'application sur la VM Azure & migrer la base de données
4. Accéder à l'application via `http://<VM_IP>/` (trouvé dans l'output de Terraform)