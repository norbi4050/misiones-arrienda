import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProfileCard from '../ProfileCard'

// Mock data para las pruebas
const mockProfile = {
  id: '1',
  user: {
    name: 'Juan Pérez',
    email: 'juan@example.com'
  },
  role: 'BUSCO' as const,
  city: 'Posadas',
  neighborhood: 'Centro',
  budget_min: 30000,
  budget_max: 50000,
  bio: 'Me gusta la naturaleza y busco un lugar tranquilo para vivir.',
  age: 28,
  tags: ['tranquilo', 'responsable'],
  preferences: {
    pet_friendly: true,
    smoking_allowed: false,
    furnished: true,
    shared_spaces: false
  },
  created_at: '2024-01-01T00:00:00Z'
}

const mockOnLike = jest.fn()
const mockOnMessage = jest.fn()

describe('ProfileCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders profile information correctly', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.getByTestId('profile-card')).toBeInTheDocument()
    expect(screen.getByTestId('profile-name')).toHaveTextContent('Juan Pérez')
    expect(screen.getByTestId('profile-location')).toHaveTextContent('Centro, Posadas')
    expect(screen.getByText('28 años')).toBeInTheDocument()
    expect(screen.getByText('Me gusta la naturaleza y busco un lugar tranquilo para vivir.')).toBeInTheDocument()
  })

  it('displays budget correctly', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.getByText('Presupuesto')).toBeInTheDocument()
    expect(screen.getByText(/\$30\.000 - \$50\.000/)).toBeInTheDocument()
  })

  it('displays role badge correctly', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.getByText('Busca')).toBeInTheDocument()
  })

  it('displays tags when available', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.getByText('Intereses')).toBeInTheDocument()
    expect(screen.getByText('tranquilo')).toBeInTheDocument()
    expect(screen.getByText('responsable')).toBeInTheDocument()
  })

  it('displays preferences correctly', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.getByText('Preferencias')).toBeInTheDocument()
    expect(screen.getByText('Mascotas')).toBeInTheDocument()
    expect(screen.getByText('Fumar')).toBeInTheDocument()
    expect(screen.getByText('Amueblado')).toBeInTheDocument()
    expect(screen.getByText('Espacios compartidos')).toBeInTheDocument()
  })

  it('calls onLike when like button is clicked', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    const likeButton = screen.getByText('Me gusta')
    fireEvent.click(likeButton)

    expect(mockOnLike).toHaveBeenCalledWith(mockProfile.id)
    expect(mockOnLike).toHaveBeenCalledTimes(1)
  })

  it('shows message button when matched', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        isMatched={true}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    const messageButton = screen.getByText('Mensaje')
    expect(messageButton).toBeInTheDocument()

    fireEvent.click(messageButton)
    expect(mockOnMessage).toHaveBeenCalledWith(mockProfile.id)
  })

  it('shows match indicator when matched', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        isMatched={true}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.getByText('💕 ¡Es un Match!')).toBeInTheDocument()
  })

  it('shows liked state correctly', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        isLiked={true}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.getByText('Te gusta')).toBeInTheDocument()
  })

  it('hides actions when showActions is false', () => {
    render(
      <ProfileCard
        profile={mockProfile}
        showActions={false}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.queryByText('Me gusta')).not.toBeInTheDocument()
    expect(screen.queryByText('Te gusta')).not.toBeInTheDocument()
  })

  it('handles profile with OFREZCO role', () => {
    const profileOfrece = {
      ...mockProfile,
      role: 'OFREZCO' as const
    }

    render(
      <ProfileCard
        profile={profileOfrece}
        onLike={mockOnLike}
        onMessage={mockOnMessage}
      />
    )

    expect(screen.getByText('Ofrece')).toBeInTheDocument()
  })
})
