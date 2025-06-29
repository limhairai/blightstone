const fs = require('fs');

const filePath = './frontend/src/contexts/AppDataContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update createAccount function
content = content.replace(
  /const createAccount = async \(data: Omit<AppAccount, 'id' \| 'dateAdded'>\) => \{[\s\S]*?toast\.success\(`Successfully created account: \$\{data\.name\}`\)\s*\}/,
  `const createAccount = async (data: Omit<AppAccount, 'id' | 'dateAdded'>) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    try {
      if (state.dataSource === 'supabase' && data.businessId) {
        // Use Supabase service
        const newAccount = await AccountService.createAccount(data.businessId.toString(), data)
        dispatch({ type: 'SET_ACCOUNTS', payload: [...state.accounts, newAccount] })
        toast.success(\`Successfully created account: \${data.name}\`)
      } else {
        // Simulate API call for demo mode
        await new Promise(resolve => setTimeout(resolve, 1000))
        dispatch({ type: 'CREATE_ACCOUNT', payload: data })
        toast.success(\`Successfully created account: \${data.name}\`)
      }
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error('Failed to create account. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    }
  }`
);

// Update updateAccount function
content = content.replace(
  /const updateAccount = async \(account: AppAccount\) => \{[\s\S]*?toast\.success\(`Successfully updated account: \$\{account\.name\}`\)\s*\}/,
  `const updateAccount = async (account: AppAccount) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    try {
      if (state.dataSource === 'supabase') {
        // Use Supabase service
        const updatedAccount = await AccountService.updateAccount(account)
        dispatch({ type: 'UPDATE_ACCOUNT', payload: updatedAccount })
        toast.success(\`Successfully updated account: \${account.name}\`)
      } else {
        // Simulate API call for demo mode
        await new Promise(resolve => setTimeout(resolve, 800))
        dispatch({ type: 'UPDATE_ACCOUNT', payload: account })
        toast.success(\`Successfully updated account: \${account.name}\`)
      }
    } catch (error) {
      console.error('Error updating account:', error)
      toast.error('Failed to update account. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    }
  }`
);

// Update deleteAccount function
content = content.replace(
  /const deleteAccount = async \(id: string \| number\) => \{[\s\S]*?toast\.success\(`Successfully deleted account: \$\{account\?\.name\}`\)\s*\}/,
  `const deleteAccount = async (id: string | number) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    try {
      const account = state.accounts.find(a => a.id === id)
      
      if (state.dataSource === 'supabase') {
        // Use Supabase service
        await AccountService.deleteAccount(id.toString())
        dispatch({ type: 'DELETE_ACCOUNT', payload: id })
        toast.success(\`Successfully deleted account: \${account?.name}\`)
      } else {
        // Simulate API call for demo mode
        await new Promise(resolve => setTimeout(resolve, 800))
        dispatch({ type: 'DELETE_ACCOUNT', payload: id })
        toast.success(\`Successfully deleted account: \${account?.name}\`)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    }
  }`
);

fs.writeFileSync(filePath, content);
console.log('Updated CRUD operations for accounts');
