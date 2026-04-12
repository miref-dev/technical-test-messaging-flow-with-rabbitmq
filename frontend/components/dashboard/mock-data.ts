export interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}

export const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'Sarah Wilson',
    receiver: 'Me',
    content: "The project looks great! Let's sync tomorrow.",
    status: 'read',
    created_at: '2024-04-11T10:35:00Z',
  },
  {
    id: '2',
    sender: 'Me',
    receiver: 'Marcus Chen',
    content: "I've sent the updated API documentation.",
    status: 'delivered',
    created_at: '2024-04-10T15:20:00Z',
  },
  {
    id: '3',
    sender: 'Alex Rivera',
    receiver: 'Me',
    content: "Can we hop on a quick call?",
    status: 'sent',
    created_at: '2024-04-11T09:00:00Z',
  }
];

