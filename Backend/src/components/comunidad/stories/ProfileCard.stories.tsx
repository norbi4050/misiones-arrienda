import type { Meta, StoryObj } from '@storybook/react'
import ProfileCard from '../ProfileCard'

const meta: Meta<typeof ProfileCard> = {
  title: 'Comunidad/ProfileCard',
  component: ProfileCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const mockProfile = {
  id: 'story-id',
  user: { name: 'María García', email: 'maria@example.com' },
  role: 'BUSCO' as const,
  city: 'Posadas',
  neighborhood: 'Centro',
  budget_min: 50000,
  budget_max: 100000,
  bio: 'Estudiante universitaria buscando departamento cerca del campus',
  age: 22,
  tags: ['estudiante', 'no fumador', 'responsable'],
  preferences: {
    pet_friendly: true,
    smoking_allowed: false,
    furnished: true,
    shared_spaces: true
  },
  created_at: '2024-01-01'
}

export const Default: Story = {
  args: {
    profile: mockProfile,
  },
}

export const Liked: Story = {
  args: {
    profile: mockProfile,
    isLiked: true,
  },
}

export const Matched: Story = {
  args: {
    profile: mockProfile,
    isMatched: true,
  },
}

export const WithoutActions: Story = {
  args: {
    profile: mockProfile,
    showActions: false,
  },
}