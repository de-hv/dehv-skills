export interface Order {
  id: string
  total: number
  status: 'open' | 'paid'
}
