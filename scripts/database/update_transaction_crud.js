const fs = require('fs');

const filePath = './frontend/src/contexts/AppDataContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update addTransaction function
content = content.replace(
  /const addTransaction = async \(data: Omit<AppTransaction, 'id'>\) => \{[\s\S]*?toast\.success\('Transaction added successfully'\)\s*\}/,
  `const addTransaction = async (data: Omit<AppTransaction, 'id'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    try {
      if (state.dataSource === 'supabase' && state.currentOrganization) {
        // Use Supabase service - need to get wallet ID first
        const walletId = 'wallet_' + state.currentOrganization.id // Simplified for now
        const newTransaction = await TransactionService.createTransaction(
          state.currentOrganization.id, 
          walletId, 
          data
        )
        dispatch({ type: 'SET_TRANSACTIONS', payload: [...state.transactions, newTransaction] })
        toast.success('Transaction added successfully')
      } else {
        // Simulate API call for demo mode
        await new Promise(resolve => setTimeout(resolve, 500))
        dispatch({ type: 'ADD_TRANSACTION', payload: data })
        toast.success('Transaction added successfully')
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    }
  }`
);

// Update createOrganization function
content = content.replace(
  /const createOrganization = async \(data: Omit<AppOrganization, 'id' \| 'created_at'>\) => \{[\s\S]*?toast\.success\(`Organization "\$\{data\.name\}" created successfully!`\)\s*\}/,
  `const createOrganization = async (data: Omit<AppOrganization, 'id' | 'created_at'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'organizations', value: true } })
    
    try {
      if (state.dataSource === 'supabase' && user) {
        // Use Supabase service
        const newOrganization = await OrganizationService.createOrganization(user.id, data)
        dispatch({ type: 'SET_ORGANIZATIONS', payload: [...state.organizations, newOrganization] })
        dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: newOrganization })
        
        // Update setup progress
        dispatch({ type: 'UPDATE_SETUP_PROGRESS', payload: { organizationCreated: true } })
        
        toast.success(\`Organization "\${data.name}" created successfully!\`)
      } else {
        // Simulate API call for demo mode
        await new Promise(resolve => setTimeout(resolve, 800))
        dispatch({ type: 'CREATE_ORGANIZATION', payload: data })
        
        // Update setup progress
        dispatch({ type: 'UPDATE_SETUP_PROGRESS', payload: { organizationCreated: true } })
        
        toast.success(\`Organization "\${data.name}" created successfully!\`)
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'organizations', value: false } })
    }
  }`
);

fs.writeFileSync(filePath, content);
console.log('Updated CRUD operations for transactions and organizations');
