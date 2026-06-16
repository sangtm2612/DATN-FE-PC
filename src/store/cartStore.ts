import { create } from 'zustand'
import type { Cart, CartItem } from '@/types'

interface CartState {
  cart: Cart
  isOpen: boolean
  setCart: (cart: Cart) => void
  setOpen: (open: boolean) => void
  getTotalItems: () => number
}

const emptyCart: Cart = { items: [], totalItems: 0, totalAmount: 0 }

export const useCartStore = create<CartState>((set, get) => ({
  cart: emptyCart,
  isOpen: false,

  setCart: (cart) => set({ cart }),
  setOpen: (open) => set({ isOpen: open }),
  getTotalItems: () => get().cart.totalItems,
}))
