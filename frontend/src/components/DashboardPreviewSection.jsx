'use client'

import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

export default function DashboardPreviewSection() {
    const controls = useAnimation();

    useEffect(() => {
        controls.start({
            y: "-70%", // 전체 이미지의 70%를 위로 스크롤
            transition: {
                duration: 12,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
            }
        });
    }, [controls]);

    return (
        <section className="w-full py-20 bg-zinc-950 flex justify-center items-center">
            <div className="w-[360px] h-[640px] rounded-lg overflow-hidden shadow-2xl border border-zinc-700 bg-zinc-900 relative">
                {/* 브라우저 헤더 간략화 */}
                <div className="h-8 bg-zinc-800 flex items-center px-3 space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>

                {/* 스크롤 애니메이션 이미지 */}
                <div className="relative w-full h-full overflow-hidden">
                    <motion.img
                        src="/images/dashboard-preview.webp" // 이미지 경로 수정
                        alt="Dashboard Preview"
                        className="w-full object-cover"
                        animate={controls}
                    />
                </div>
            </div>
        </section>
    );
}
