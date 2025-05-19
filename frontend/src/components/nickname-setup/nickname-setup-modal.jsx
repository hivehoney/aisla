'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import MapModal from "@/components/map-modal";

export function NicknameSetupModal({ onClose }) {
  const { data: session, update: updateSession } = useSession();
  const [nickname, setNickname] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeLatitude, setStoreLatitude] = useState(null);
  const [storeLongitude, setStoreLongitude] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const validateStoreName = (name) => {
    if (name.length < 2) return "스토어 이름은 2자 이상이어야 합니다";
    if (name.length > 50) return "스토어 이름은 50자 이하여야 합니다";
    return "";
  };

  const validateStoreAddress = (address) => {
    if (address.length < 5) return "주소는 5자 이상이어야 합니다";
    if (address.length > 200) return "주소는 200자 이하여야 합니다";
    return "";
  };

  const validatePhone = (phone) => {
    if (phone && !/^[0-9-+()]*$/.test(phone)) {
      return "전화번호는 숫자, 하이픈(-), 괄호(), +만 사용 가능합니다";
    }
    return "";
  };

  const handleLocationSelect = (location) => {
    if (location) {
      setStoreName(location.title);
      setStoreAddress(location.address);
      setStorePhone(location.telephone || "");
      setStoreLatitude(location.latitude);
      setStoreLongitude(location.longitude);
    }
    setIsMapModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const nameError = validateStoreName(storeName);
    const addressError = validateStoreAddress(storeAddress);
    const phoneError = validatePhone(storePhone);

    if (nameError || addressError || phoneError) {
      toast.error(nameError || addressError || phoneError);
      return;
    }

    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요");
      return;
    }

    setIsLoading(true);
    try {
      // 스토어 등록
      const storeResponse = await fetch("/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: storeName.trim(),
          address: storeAddress.trim(),
          phone: storePhone.trim(),
          latitude: storeLatitude,
          longitude: storeLongitude
        }),
      });

      if (!storeResponse.ok) {
        const errorData = await storeResponse.json();
        throw new Error(errorData.error || "스토어 등록에 실패했습니다");
      }

      toast.success("스토어가 등록되었습니다!");

      // 닉네임 설정
      const nicknameResponse = await fetch("/api/user/nickname", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!nicknameResponse.ok) {
        const errorData = await nicknameResponse.json();
        throw new Error(errorData.error || "닉네임 설정에 실패했습니다");
      }

      const user = await nicknameResponse.json();

      await updateSession({
        ...session,
        user: {
          ...session.user,
          nickname: user.nickname
        },
      });

      toast.success("닉네임이 설정되었습니다!");
      onClose?.(); // 모달 닫기

    } catch (error) {
      console.error("설정 오류:", error);
      toast.error(error.message || "설정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>닉네임 및 스토어 등록</CardTitle>
          <CardDescription>
            서비스 이용을 위해 닉네임과 스토어 정보를 등록해주세요.
            설정된 닉네임은 언제든 변경할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">닉네임</label>
              <Input
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isLoading}
                minLength={2}
                maxLength={20}
                pattern="^[a-zA-Z0-9_-]+$"
                title="영문, 숫자, 밑줄(_), 하이픈(-)만 사용 가능합니다"
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">스토어 이름</label>
                <Input
                  placeholder="GS25 대전중앙점 (2-50자)"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  disabled={isLoading}
                  minLength={2}
                  maxLength={50}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">스토어 주소</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="지도에서 위치를 선택해주세요"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    disabled={isLoading || true}
                    minLength={5}
                    maxLength={200}
                    required
                  />
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setIsMapModalOpen(true)}
                    disabled={isLoading}
                  >
                    주소 검색
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">주소는 지도에서 위치를 선택해주세요</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">스토어 전화번호 (선택)</label>
                <Input
                  placeholder="042-123-4567"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  disabled={isLoading}
                  type="tel"
                  pattern="[0-9-+()]*"
                  title="숫자, 하이픈(-), 괄호(), +만 사용 가능합니다"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              disabled={isLoading || !nickname.trim() || !storeName.trim() || !storeAddress.trim()}
              className="w-full mt-4"
            >
              {isLoading ? "등록 중..." : "등록하기"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <MapModal
        isOpen={isMapModalOpen}
        onClose={handleLocationSelect}
      />
    </div>
  );
} 