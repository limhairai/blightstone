# ⚙️ AdHub Configuration Directory

This directory contains all configuration files organized by service and environment.

## 📁 **Directory Structure**

### **🚀 Render.com Configurations** [`render/`](./render/)
Deployment configurations for Render.com hosting:

- **`render.yaml`** - Production deployment configuration
- **`render-staging.yaml`** - Staging environment configuration

### **🐳 Docker Configurations** [`docker/`](./docker/)
Docker and containerization configurations:

- Container build configurations
- Docker Compose files
- Environment-specific Docker settings

### **🔧 Environment Templates** [`env/`](./env/)
Environment variable templates and examples:

- Environment variable templates
- Configuration examples
- Security guidelines

## 🚀 **Quick Setup Guide**

### **Render.com Deployment:**
1. Copy the appropriate config from `render/`
2. Customize environment variables
3. Deploy using Render.com dashboard or CLI

### **Docker Setup:**
1. Review Docker configurations in `docker/`
2. Customize for your environment
3. Use with `docker-compose up`

### **Environment Configuration:**
1. Copy templates from `env/`
2. Fill in your specific values
3. Place in appropriate project directories

## 📝 **Configuration Files**

### **Render Configurations:**
```yaml
# render/render.yaml - Production
services:
  - type: web
    name: adhub-frontend
    env: node
    buildCommand: npm run build
    startCommand: npm start
    
  - type: web  
    name: adhub-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python main.py
```

### **Environment Variables:**
Key environment variables across services:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_ENVIRONMENT` - Environment (development/staging/production)
- `BACKEND_URL` - Backend API URL

## 🔒 **Security Guidelines**

### **Environment Variables:**
- ❌ Never commit actual secrets to version control
- ✅ Use environment variable templates
- ✅ Use secure secret management in production
- ✅ Rotate secrets regularly

### **Configuration Files:**
- ❌ Avoid hardcoded credentials
- ✅ Use environment variable references
- ✅ Document required variables
- ✅ Provide example values (non-sensitive)

## 📁 **File Organization**

### **Adding New Configurations:**
1. **Choose appropriate directory:**
   - `render/` - Render.com deployment configs
   - `docker/` - Docker and containerization
   - `env/` - Environment templates

2. **Follow naming conventions:**
   - Use descriptive names
   - Include environment suffix (e.g., `-staging`, `-prod`)
   - Use appropriate file extensions

3. **Include documentation:**
   - Add file description to this README
   - Document required variables
   - Provide setup instructions

## 🔗 **Related Documentation**

- [`../docs/deployment/`](../docs/deployment/) - Deployment guides
- [`../scripts/deployment/`](../scripts/deployment/) - Deployment scripts
- [`../docs/development/`](../docs/development/) - Development setup

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Missing environment variables:**
   - Check templates in `env/`
   - Verify all required variables are set
   - Use `scripts/dev/check_env.py` to validate

2. **Deployment failures:**
   - Review configuration syntax
   - Check environment variable values
   - Verify service dependencies

3. **Configuration conflicts:**
   - Ensure environment-specific configs are correct
   - Check for conflicting settings
   - Validate against service requirements

### **Getting Help:**
- Review deployment documentation in `docs/deployment/`
- Check environment with validation scripts
- Consult service-specific documentation

---

*Configurations organized for better environment management and deployment.* 