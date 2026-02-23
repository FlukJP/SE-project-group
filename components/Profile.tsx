'use client'

export default function ProfileMenu({ onClose }: { onClose: () => void }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={menu} onClick={(e) => e.stopPropagation()}>
        <div style={item}>รีวิวของฉัน</div>
        <div style={item}>จัดการประกาศ</div>
        <div style={item}>โปรไฟล์ของฉัน</div>
        <div style={item}>ประวัติการใช้งาน</div>
        <div style={item}>แชท</div> 
        <div style={item}>รายการโปรด</div> 
        <div style={item}>ดูและแก้ไขข้อมูลส่วนตัว</div> 
        <hr />
        <div style={{ ...item, color: 'red' }}>ออกจากระบบ</div>
      </div>
    </div>
  )
}

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