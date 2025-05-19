import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
export default function ProductCard({ product, stores }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedStore, setSelectedStore] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleAddToCart = async () => {
    if (!selectedStore) {
      alert('스토어를 선택해주세요')
      return
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          storeId: selectedStore
        }),
      })

      if (!response.ok) {
        throw new Error('장바구니 추가 실패')
      }

      router.refresh()
    } catch (error) {
      console.error('장바구니 추가 중 오류:', error)
      alert('장바구니 추가 중 오류가 발생했습니다')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative aspect-square">
        <Image
          src={product.imageUrl || '/placeholder.png'}
          alt={product.name}
          className="object-cover w-full h-full"
          fill
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-2">{product.price.toLocaleString()}원</p>
        
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 rounded-md mb-2"
          >
            {selectedStore ? stores.find(s => s.id === selectedStore)?.name : '스토어 선택'}
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute w-full bg-white border rounded-md shadow-lg z-10">
              {stores.map(store => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store.id)
                    setIsDropdownOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  {store.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          disabled={!selectedStore}
        >
          장바구니 담기
        </button>
      </div>
    </div>
  )
} 