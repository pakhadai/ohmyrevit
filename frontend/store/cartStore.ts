import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'

interface CartStore {
  items: Product[]
  promoCode: string | null
  useBonusPoints: number

  // Actions
  addItem: (item: Product) => void
  removeItem: (id: number) => void
  clearCart: () => void
  setPromoCode: (code: string | null) => void
  setBonusPoints: (points: number) => void
  getTotalPrice: () => number
  getItemsCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      useBonusPoints: 0,

      addItem: (item) => {
        set((state) => {
          const exists = state.items.find(i => i.id === item.id)
          if (exists) return state
          return { items: [...state.items, item] }
        })
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id)
        }))
      },

      clearCart: () => {
        set({ items: [], promoCode: null, useBonusPoints: 0 })
      },

      setPromoCode: (code) => {
        set({ promoCode: code, useBonusPoints: 0 })
      },

      setBonusPoints: (points) => {
        set({ useBonusPoints: points, promoCode: null })
      },

      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => {
          // ВИПРАВЛЕННЯ: Примусова конвертація в Number
          const price = Number(item.sale_price) || Number(item.price)
          return total + price
        }, 0)
      },

      getItemsCount: () => {
        return get().items.length
      }
    }),
    {
      name: 'cart-storage',
    }
  )
)