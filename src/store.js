import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useStore = create(
  persist(
    (set) => ({
      data: {
        clients: [],
        partners: [],
        products: [],
        projects: [],
        followups: [],
        projectComments: []
      },
      setData: (data) => set({ data })
    }),
    { name: "zustand-store" }
  )
)
