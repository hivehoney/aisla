'use client'

import { TypeAnimation } from 'react-type-animation';

export default function AnimatedHeading() {
  return (
    <h1 className="text-5xl sm:text-5xl font-extrabold tracking-tight leading-tight min-h-[160px]">
      <TypeAnimation
        sequence={[
          '수요를 예측하고\n재고를 최적화하세요', 
          3000,
          '매출을 증대하고\n손실을 최소화하세요', 
          3000,
          '데이터로 분석하고\n경쟁력을 확보하세요', 
          3000,
          '고객을 만족시키고\n재방문을 유도하세요', 
          3000,
        ]}
        speed={50}
        repeat={Infinity}
        style={{ whiteSpace: 'pre-line', display: 'block' }}
        cursor={true}
        className="text-5xl sm:text-5xl font-extrabold tracking-tight leading-tight"
      />
    </h1>
  );
} 