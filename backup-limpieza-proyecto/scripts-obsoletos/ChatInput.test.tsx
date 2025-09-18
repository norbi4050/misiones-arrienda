import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChatInput from '@/components/comunidad/ChatInput'

describe('ChatInput', () => {
  it('renders input and send button', () => {
    render(<ChatInput onSendMessage={jest.fn()} />)
    
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
    expect(screen.getByTestId('send-button')).toBeInTheDocument()
  })

  it('calls onSendMessage when form is submitted', () => {
    const mockSendMessage = jest.fn()
    render(<ChatInput onSendMessage={mockSendMessage} />)
    
    const input = screen.getByTestId('chat-input')
    const sendButton = screen.getByTestId('send-button')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    expect(mockSendMessage).toHaveBeenCalledWith('Test message')
  })

  it('clears input after sending message', () => {
    render(<ChatInput onSendMessage={jest.fn()} />)
    
    const input = screen.getByTestId('chat-input') as HTMLInputElement
    const sendButton = screen.getByTestId('send-button')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    expect(input.value).toBe('')
  })
})