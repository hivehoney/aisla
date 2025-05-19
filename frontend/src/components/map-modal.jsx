'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Check } from 'lucide-react';

export default function MapModal({ isOpen, onClose }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [searchQuery, setSearchQuery] = useState('CU 아주대');
  const [searchResults, setSearchResults] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const scriptLoadedRef = useRef(false);
  const isInitializedRef = useRef(false);

  // 지도 초기화
  const initializeMap = () => {
    if (!mapRef.current || !window.naver || !window.naver.maps) return;
    
    try {
      // 지도 인스턴스가 이미 있으면 초기화
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
      
      // 새 지도 인스턴스 생성
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5665, 126.9780),
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      };

      mapInstance.current = new window.naver.maps.Map(mapRef.current, mapOptions);
      isInitializedRef.current = true;
      
      // 초기 검색 실행
      if (!isLoading && searchQuery) {
        searchPlaces();
      }
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  };

  // 마커를 다시 표시하는 함수
  const redrawMarkers = () => {
    if (!mapInstance.current || !searchResults.length || !window.naver) return;

    try {
      // 기존 마커 제거
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);

      // 새로운 마커 생성
      const newMarkers = searchResults.map(item => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(
            parseFloat(item.mapy) / 10000000,
            parseFloat(item.mapx) / 10000000
          ),
          map: mapInstance.current,
          title: item.title.replace(/<[^>]*>/g, ''),
        });

        const infoWindow = new window.naver.maps.InfoWindow({
          content: `
            <div class="p-4 min-w-[200px]">
              <h3 class="font-semibold mb-2">${item.title}</h3>
              <p class="text-sm text-gray-600 mb-1">${item.address}</p>
              <p class="text-sm text-gray-600">${item.telephone || '전화번호 없음'}</p>
            </div>
          `,
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindow.open(mapInstance.current, marker);
        });

        return marker;
      });

      setMarkers(newMarkers);

      // 선택된 위치가 있으면 해당 위치로 지도 중심 이동
      if (selectedLocation && mapInstance.current) {
        mapInstance.current.setCenter(
          new window.naver.maps.LatLng(
            selectedLocation.latitude,
            selectedLocation.longitude
          )
        );
      } else if (newMarkers.length > 0 && mapInstance.current) {
        // 선택된 위치가 없으면 첫 번째 마커로 이동
        mapInstance.current.setCenter(newMarkers[0].getPosition());
      }
    } catch (error) {
      console.error('Error drawing markers:', error);
    }
  };

  const searchPlaces = async () => {
    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 기존 마커 제거 (재검색 시 마커가 사라지는 문제 해결)
      if (markers.length > 0 && window.naver) {
        markers.forEach(marker => marker.setMap(null));
      }

      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '검색에 실패했습니다.');
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('검색 결과가 없습니다.');
      }

      setSearchResults(data.items);
      
      // 맵 인스턴스가 준비되면 마커 그리기
      if (mapInstance.current && window.naver) {
        setTimeout(() => redrawMarkers(), 100);
      }
    } catch (error) {
      setError(error.message);
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 열리거나 닫힐 때 처리
  useEffect(() => {
    // 모달이 닫힐 때 정리
    if (!isOpen) {
      // 마커 정리
      if (markers.length > 0 && window.naver) {
        markers.forEach(marker => marker.setMap(null));
        setMarkers([]);
      }
      
      return;
    }
    
    // 모달이 열렸을 때 처리
    const loadNaverMapsScript = () => {
      // 이미 스크립트가 로드된 경우 바로 맵 초기화
      if (window.naver && window.naver.maps) {
        scriptLoadedRef.current = true;
        setTimeout(() => initializeMap(), 50);
        return;
      }
      
      // 스크립트가 로드되지 않은 경우 로드
      const script = document.createElement('script');
      script.id = 'naver-maps-script';
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLOUD_PLATFORM_CLIENT_ID}`;
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        setTimeout(() => initializeMap(), 50);
      };

      document.head.appendChild(script);
    };
    
    loadNaverMapsScript();
    
  }, [isOpen]);

  // 검색 결과가 변경되면 마커 다시 그리기
  useEffect(() => {
    if (mapInstance.current && searchResults.length > 0 && window.naver) {
      redrawMarkers();
    }
  }, [searchResults]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (mapInstance.current && window.naver) {
        // 마커 정리
        markers.forEach(marker => marker.setMap(null));
        
        // 지도 인스턴스 정리
        mapInstance.current = null;
      }
    };
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPlaces();
    }
  };

  const handleSelectLocation = (result) => {
    setSelectedLocation({
      title: result.title.replace(/<[^>]*>/g, ''),
      address: result.address,
      telephone: result.telephone,
      latitude: parseFloat(result.mapy) / 10000000,
      longitude: parseFloat(result.mapx) / 10000000
    });

    // 지도 중심 이동
    if (mapInstance.current && window.naver) {
      mapInstance.current.setCenter(
        new window.naver.maps.LatLng(
          parseFloat(result.mapy) / 10000000,
          parseFloat(result.mapx) / 10000000
        )
      );
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      // 선택된 위치 정보를 부모 컴포넌트로 전달
      onClose(selectedLocation);
    }
  };

  const handleDialogClose = () => {
    // 모달이 닫힐 때 지도 인스턴스 정리
    onClose(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="min-w-[95vw] w-[95vw] h-[95vh] p-0 flex flex-col">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>지도 검색</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-1 min-h-0">
          {/* 왼쪽: 검색 및 결과 패널 */}
          <div className="w-[400px] border-r flex flex-col">
            <div className="p-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="지역을 입력하세요"
                  className="flex-1"
                />
                <Button 
                  onClick={searchPlaces}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  검색
                </Button>
              </div>
              {error && (
                <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded">
                  {error}
                </div>
              )}
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <div className="flex-1 overflow-y-auto border-t">
                {searchResults.map((result, index) => {
                  const isSelected = selectedLocation?.title === result.title.replace(/<[^>]*>/g, '');
                  return (
                    <div
                      key={index}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 last:border-b-0 ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleSelectLocation(result)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium mb-1">{result.title.replace(/<[^>]*>/g, '')}</h3>
                          <p className="text-sm text-gray-600">{result.address}</p>
                          {result.telephone && (
                            <p className="text-sm text-gray-600">{result.telephone}</p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 오른쪽: 지도 */}
          <div className="flex-1 min-h-0">
            <div
              ref={mapRef}
              className="w-full h-full"
              id="map-container"
            />
          </div>
        </div>

        {/* 선택된 위치 정보 및 확인 버튼 */}
        <DialogFooter className="p-4 border-t bg-white">
          <div className="flex items-center justify-between w-full">
            {selectedLocation ? (
              <div className="flex-1 mr-4 overflow-y-auto max-h-[100px]">
                <h3 className="font-medium">선택된 위치</h3>
                <p className="text-sm text-gray-600">{selectedLocation.title}</p>
                <p className="text-sm text-gray-600">{selectedLocation.address}</p>
                {selectedLocation.telephone && (
                  <p className="text-sm text-gray-600">{selectedLocation.telephone}</p>
                )}
                <p className="text-sm text-gray-600">
                  위도: {selectedLocation.latitude}, 경도: {selectedLocation.longitude}
                </p>
              </div>
            ) : (
              <div className="flex-1 mr-4 text-sm text-gray-500">
                위치를 선택해주세요
              </div>
            )}
            <Button 
              onClick={handleConfirm}
              disabled={!selectedLocation}
            >
              선택 완료
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}