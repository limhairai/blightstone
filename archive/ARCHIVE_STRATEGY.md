# 📦 AdHub Archive Strategy

## 🎯 Purpose
This archive contains over-engineered features that were built early but aren't needed for MVP. We're keeping them because they represent valuable work that might be useful later.

## 📋 What's Archived & Why

### **Design System (Future: Scale)**
- **When to use**: When you have 50+ components and design consistency issues
- **Current status**: Using shadcn/ui directly is simpler
- **Retrieval trigger**: Team grows to 5+ developers

### **Complex State Management (Future: Scale)**
- **When to use**: When simple useState/useContext becomes unwieldy  
- **Current status**: Simple context is sufficient
- **Retrieval trigger**: App has 20+ interconnected features

### **Advanced Security (Future: Enterprise)**
- **When to use**: When you have enterprise customers or handle sensitive data
- **Current status**: Supabase auth + basic middleware is sufficient
- **Retrieval trigger**: First enterprise customer or security audit requirement

### **Comprehensive Testing (Future: Team Growth)**
- **When to use**: When you have multiple developers and complex features
- **Current status**: Basic tests for core flows are sufficient
- **Retrieval trigger**: Team grows to 3+ developers

## 🚀 Retrieval Guidelines

### **Phase 1: MVP (0-100 users)**
- Keep it simple
- Focus on core features
- Use standard patterns

### **Phase 2: Growth (100-1000 users)**
- Consider retrieving design system
- Add more comprehensive testing
- Keep security simple

### **Phase 3: Scale (1000+ users)**
- Retrieve complex state management
- Implement advanced security
- Full design system

## 💡 The Rule
**"Retrieve only when the pain of not having it exceeds the complexity of maintaining it"**

## 📝 Archive Log
- **2024-06**: Initial archive creation
- **Files archived**: Design system, complex state management, advanced security
- **Reason**: Focusing on MVP and core features
- **Next review**: When we hit 100 active users
