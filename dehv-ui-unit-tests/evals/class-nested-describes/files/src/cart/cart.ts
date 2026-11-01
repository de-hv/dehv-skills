export interface CartItem {
  sku: string
  price: number
  quantity: number
}

export class Cart {
  private items: CartItem[] = []

  add(item: CartItem): void {
    if (item.quantity <= 0) throw new Error('quantity must be positive')
    this.items.push(item)
  }

  remove(sku: string): boolean {
    const before = this.items.length
    this.items = this.items.filter((item) => item.sku !== sku)
    return this.items.length < before
  }

  total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }
}
