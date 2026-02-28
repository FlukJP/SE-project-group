"use client";

import { useRouter } from "next/navigation";

type TabKey = "profile" | "autoReply" | "review" | "manageProfile" | "account";

export default function ProfileMenu({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate?: (tab: TabKey) => void;
}) {
  const router = useRouter();

  const handleNavigate = (tab: TabKey) => {
    if (onNavigate) {
      onNavigate(tab);
    } else {
      router.push(`/profile?tab=${tab}`);
      onClose();
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={menu} onClick={(e) => e.stopPropagation()}>
        <div style={item} onClick={() => handleNavigate("profile")}>
          ดูและแก้ไขข้อมูลส่วนตัว
        </div>
        
        <div style={item} onClick={() => handleNavigate("review")}>
          รีวิวของฉัน
        </div>
        <div style={item} onClick={() => handleNavigate("manageProfile")}>
          โปรไฟล์ของฉัน
        </div>

        <div style={item} onClick={() => { router.push("/history"); onClose(); }}>
          ประวัติการใช้งาน
        </div>
        <div style={item} onClick={() => { router.push("/chat"); onClose(); }}>
          แชท
        </div>
        <div style={item} onClick={() => { router.push("/favorites"); onClose(); }}>
          รายการโปรด
        </div>



        <hr />

        <div
          style={{ ...item, color: "red" }}
          onClick={() => {
            // TODO: clear token/cookie later
            onClose();
            router.push("/");
          }}
        >
          ออกจากระบบ
        </div>
      </div>
    </div>
  );
}

/* ถ้าไฟล์เดิมแกมี overlay/menu/item อยู่แล้ว ใช้ของเดิมได้เลย */
const overlay = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
}

const menu = {
  position: 'fixed' as const,
  top: 56,
  right: 16,
  width: 260,
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  padding: 12,
  zIndex: 1000,
}

const item = {
  padding: '10px 12px',
  cursor: 'pointer',
}