# 🔧 AdHub Scripts Directory

This directory contains all utility scripts organized by purpose and usage context.

## 📁 **Directory Structure**

### **🛠️ Development Scripts** [`dev/`](./dev/)
Scripts for local development and testing:

- **`start-dev-servers.sh`** - Start all development servers (frontend, backend, telegram-bot)
- **`test-proxy.sh`** - Test proxy configuration and connectivity  
- **`check_env.py`** - Validate environment variables and configuration
- **`set-env.sh`** - Set up environment variables for development

### **🚀 Deployment Scripts** [`deployment/`](./deployment/)
Scripts for deployment and production setup:

- **`setup-staging.sh`** - Set up staging environment
- **`verify-schema.js`** - Verify database schema consistency
- **`manage_emulators.sh`** - Manage Firebase/Supabase emulators

### **🔧 Maintenance Scripts** [`maintenance/`](./maintenance/)
Scripts for ongoing maintenance and monitoring:

- **`monitor-services.sh`** - Monitor all services health and status

## 🚀 **Quick Usage Guide**

### **Starting Development Environment:**
```bash
# Start all development servers
./scripts/dev/start-dev-servers.sh

# Check environment configuration
python ./scripts/dev/check_env.py

# Test proxy connectivity
./scripts/dev/test-proxy.sh
```

### **Deployment Tasks:**
```bash
# Set up staging environment
./scripts/deployment/setup-staging.sh

# Verify database schema
node ./scripts/deployment/verify-schema.js

# Manage emulators
./scripts/deployment/manage_emulators.sh
```

### **Maintenance Tasks:**
```bash
# Monitor all services
./scripts/maintenance/monitor-services.sh
```

## ⚙️ **Script Requirements**

### **Prerequisites:**
- **Node.js** (for JavaScript scripts)
- **Python 3.8+** (for Python scripts)
- **Bash** (for shell scripts)
- **Required environment variables** (see individual scripts)

### **Permissions:**
Make scripts executable if needed:
```bash
chmod +x scripts/**/*.sh
```

## 📝 **Adding New Scripts**

When adding new scripts:

1. **Choose the appropriate directory:**
   - `dev/` - Development and testing
   - `deployment/` - Deployment and setup
   - `maintenance/` - Monitoring and maintenance

2. **Follow naming conventions:**
   - Use descriptive names
   - Use hyphens for multi-word names
   - Include appropriate file extensions

3. **Include documentation:**
   - Add script description to this README
   - Include usage examples
   - Document any prerequisites

4. **Make scripts robust:**
   - Include error handling
   - Validate prerequisites
   - Provide helpful output

## 🔗 **Related Documentation**

- [`../docs/development/`](../docs/development/) - Development guides
- [`../docs/deployment/`](../docs/deployment/) - Deployment documentation
- [`../config/`](../config/) - Configuration files

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Permission denied:**
   ```bash
   chmod +x scripts/path/to/script.sh
   ```

2. **Environment variables not set:**
   ```bash
   python scripts/dev/check_env.py
   ```

3. **Dependencies missing:**
   - Check script requirements in comments
   - Install required packages/tools

### **Getting Help:**
- Check individual script help: `script.sh --help`
- Review related documentation in `docs/`
- Check environment with `scripts/dev/check_env.py`

---

*Scripts organized for better maintainability and discoverability.* 