'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts'
import { 
  BarChart3, 
  CalendarIcon, 
  ChevronDown,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast'

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const timeRanges = [
  { id: 'week', label: '최근 7일' },
  { id: 'month', label: '최근 30일' },
  { id: 'quarter', label: '최근 3개월' },
  { id: 'year', label: '최근 1년' }
];

const StoreSalesChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState(timeRanges[1]); // 기본값: 최근 30일
  const { toast } = useToast();
  
  // 차트 데이터 가져오기
  const fetchData = async (timeRange) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/sales-ratio?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('매출 데이터를 가져오는데 실패했습니다.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 각 스토어에 색상 할당
        const formattedData = result.data.map((item, index) => ({
          ...item,
          color: COLORS[index % COLORS.length]
        }));
        setData(formattedData);
      } else {
        throw new Error(result.message || '데이터 로드 실패');
      }
    } catch (error) {
      console.error('차트 데이터 로딩 오류:', error);
      toast({
        title: '데이터 로딩 오류',
        description: error.message,
        variant: 'destructive'
      });
      // 에러 발생 시 샘플 데이터 표시
      setData(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  // 시간 범위 변경 시 데이터 업데이트
  useEffect(() => {
    fetchData(selectedRange.id);
  }, [selectedRange]);
  
  // 샘플 데이터 생성 함수
  const getSampleData = () => {
    return [
      { name: '강남점', value: 35, color: COLORS[0] },
      { name: '홍대점', value: 25, color: COLORS[1] },
      { name: '신사점', value: 18, color: COLORS[2] },
      { name: '명동점', value: 15, color: COLORS[3] },
      { name: '판교점', value: 7, color: COLORS[4] }
    ];
  };
  
  // 시간 범위 선택 핸들러
  const handleRangeChange = (range) => {
    setSelectedRange(range);
  };
  
  // 툴팁 커스터마이징
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">{`${data.value}% (${data.amount?.toLocaleString()}원)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            스토어 매출 비율
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {selectedRange.label}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {timeRanges.map(range => (
                <DropdownMenuItem 
                  key={range.id}
                  onClick={() => handleRangeChange(range)}
                  className={selectedRange.id === range.id ? "bg-muted" : ""}
                >
                  {range.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">데이터 로딩 중...</p>
          </div>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  formatter={(value, entry) => (
                    <span className="text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StoreSalesChart 