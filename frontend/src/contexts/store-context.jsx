'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const StoreContext = createContext()

export function StoreProvider({ children }) {
  const [selectedStore, setSelectedStore] = useState(null)
  const [stores, setStores] = useState([])
  const [hasStores, setHasStores] = useState(false)

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch('/api/stores')
      const data = await response.json()
      setStores(data)
      setHasStores(data.length > 0)
      
      // 기존 선택 스토어가 더 이상 존재하지 않으면 선택 해제
      if (selectedStore && !data.some(store => store.id === selectedStore.id)) {
        setSelectedStore(null)
      }
    } catch (error) {
      console.error('스토어 정보 로딩 중 오류:', error)
      setHasStores(false)
    }
  }, [selectedStore])

  // 스토어 추가 메서드
  const addStore = async (newStore) => {
    try {
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStore),
      })
      
      if (!response.ok) {
        throw new Error('스토어 추가 실패')
      }
      
      const addedStore = await response.json()
      setStores(prevStores => [...prevStores, addedStore])
      setHasStores(true)
      
      return addedStore
    } catch (error) {
      console.error('스토어 추가 중 오류:', error)
      throw error
    }
  }

  // 스토어 업데이트 메서드
  const updateStore = async (storeId, updatedData) => {
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })
      
      if (!response.ok) {
        throw new Error('스토어 업데이트 실패')
      }
      
      const updatedStore = await response.json()
      
      setStores(prevStores => 
        prevStores.map(store => 
          store.id === storeId ? updatedStore : store
        )
      )
      
      // 선택된 스토어가 업데이트된 스토어면 선택된 스토어도 업데이트
      if (selectedStore && selectedStore.id === storeId) {
        setSelectedStore(updatedStore)
      }
      
      return updatedStore
    } catch (error) {
      console.error('스토어 업데이트 중 오류:', error)
      throw error
    }
  }

  // 스토어 삭제 메서드
  const deleteStore = async (storeId) => {
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('스토어 삭제 실패')
      }
      
      setStores(prevStores => prevStores.filter(store => store.id !== storeId))
      
      // 삭제된 스토어가 선택된 스토어면 선택 해제
      if (selectedStore && selectedStore.id === storeId) {
        setSelectedStore(null)
      }
      
      // 스토어 존재 여부 업데이트
      const remainingStores = stores.filter(store => store.id !== storeId)
      setHasStores(remainingStores.length > 0)
      
      return true
    } catch (error) {
      console.error('스토어 삭제 중 오류:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  return (
    <StoreContext.Provider value={{ 
      selectedStore, 
      setSelectedStore, 
      stores, 
      hasStores, 
      fetchStores,
      addStore,
      updateStore,
      deleteStore
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
} 