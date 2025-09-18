import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProfileCard from '@/components/comunidad/ProfileCard'

const mockProfile = {
  id: 'test-id',
  user: { name: 'Test User', email: 'test@example.com' },
  role: 'BUSCO' as const,
  city: 'Posadas',
  neighborhood: 'Centro',
  budget_min: 50000,
  budget_max: 100000,
  bio: 'Test bio',
  age: 25,
  tags: ['test'],
  preferences: {
    pet_friendly: true,
    smoking_allowed: false,
    furnished: true,
    shared_spaces: false
  },
  created_at: '2024-01-01'
}

describe('ProfileCard', () => {
  it('renders profile information correctly', () => {
    render(<ProfileCard profile={mockProfile} />)
    
    expect(screen.getByTestId('profile-card')).toBeInTheDocument()
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User')
    expect(screen.getByTestId('profile-location')).toHaveTextContent('Centro, Posadas')
    expect(screen.getByTestId('profile-role')).toHaveTextContent('Busca')
  })

  it('handles like button click', async () => {
    const mockOnLike = jest.fn()
    render(<ProfileCard profile={mockProfile} onLike={mockOnLike} />)
    
    const likeButton = screen.getByTestId('like-button')
    fireEvent.click(likeButton)
    
    await waitFor(() => {
      expect(mockOnLike).toHaveBeenCalledWith('test-id')
    })
  })

  it('shows message button when matched', () => {
    render(<ProfileCard profile={mockProfile} isMatched={true} />)
    
    expect(screen.getByTestId('message-button')).toBeInTheDocument()
  })
})