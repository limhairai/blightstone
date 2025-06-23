const fs = require('fs');
const path = require('path');

const filePath = './frontend/src/contexts/AppDataContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update updateBusiness function
content = content.replace(
  /const updateBusiness = async \(business: AppBusiness\) => \{[\s\S]*?toast\.success\(`Successfully updated business: \$\{business\.name\}`\)\s*\}/,
  `const updateBusiness = async (business: AppBusiness) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    try {
      if (state.dataSource === 'supabase') {
        // Use Supabase service
        const updatedBusiness = await BusinessService.updateBusiness(business)
        dispatch({ type: 'UPDATE_BUSINESS', payload: updatedBusiness })
        toast.success(\`Successfully updated business: \${business.name}\`)
      } else {
        // Simulate API call for demo mode
        await new Promise(resolve => setTimeout(resolve, 800))
        dispatch({ type: 'UPDATE_BUSINESS', payload: business })
        toast.success(\`Successfully updated business: \${business.name}\`)
      }
    } catch (error) {
      console.error('Error updating business:', error)
      toast.error('Failed to update business. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    }
  }`
);

// Update deleteBusiness function
content = content.replace(
  /const deleteBusiness = async \(id: string \| number\) => \{[\s\S]*?toast\.success\(`Successfully deleted business: \$\{business\?\.name\}`\)\s*\}/,
  `const deleteBusiness = async (id: string | number) => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: true } })
    
    try {
      const business = state.businesses.find(b => b.id === id)
      
      if (state.dataSource === 'supabase') {
        // Use Supabase service
        await BusinessService.deleteBusiness(id.toString())
        dispatch({ type: 'DELETE_BUSINESS', payload: id })
        toast.success(\`Successfully deleted business: \${business?.name}\`)
      } else {
        // Simulate API call for demo mode
        await new Promise(resolve => setTimeout(resolve, 800))
        dispatch({ type: 'DELETE_BUSINESS', payload: id })
        toast.success(\`Successfully deleted business: \${business?.name}\`)
      }
    } catch (error) {
      console.error('Error deleting business:', error)
      toast.error('Failed to delete business. Please try again.')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'actions', value: false } })
    }
  }`
);

fs.writeFileSync(filePath, content);
console.log('Updated CRUD operations for businesses');
