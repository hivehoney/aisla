'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { NicknameSetupModal } from "./nickname-setup-modal";

export function NicknameSetupProvider({ children }) {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);


  useEffect(() => {
    if (status === "authenticated" && !session?.user?.nickname) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [status, session?.user?.nickname]);

  return (
    <>
      {children}
      {showModal && <NicknameSetupModal />}
    </>
  );
} 