'use client'

export default function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Close button */}
        <button onClick={onClose} style={closeBtn}>✕</button>

        {/* Illustration */}
        <div style={imageBox}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/609/609803.png"
            alt="login"
            style={{ width: 120 }}
          />
        </div>

        <h2 style={title}>เริ่มต้นใช้งาน</h2>

        {/* Email */}
        <button style={emailBtn}>
          ✉️ เข้าสู่ระบบด้วยอีเมล
        </button>

        {/* Google */}
        <button style={googleBtn}>
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            style={{ width: 20, marginRight: 8 }}
          />
          เชื่อมต่อด้วย Google
        </button>

        <div style={orText}>หรือแค่</div>

        {/* Phone */}
        <input
          placeholder="เบอร์โทรศัพท์"
          style={input}
        />

        <button style={confirmBtn}>ยืนยัน</button>

        <p style={policy}>
          กด “ยืนยัน” เพื่อยอมรับ{' '}
          <span style={link}>เงื่อนไขการใช้บริการ</span>{' '}
          และ{' '}
          <span style={link}>นโยบายความเป็นส่วนตัว</span>
        </p>
      </div>
    </div>
  )
}

/* ===== styles ===== */

const overlay = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
}

const modal = {
  background: '#fff',
  borderRadius: 16,
  width: 520,
  padding: '32px 40px',
  position: 'relative' as const,
  textAlign: 'center' as const,
}

const closeBtn = {
  position: 'absolute' as const,
  top: 16,
  right: 16,
  border: 'none',
  background: 'transparent',
  fontSize: 20,
  cursor: 'pointer',
}

const imageBox = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 16,
}

const title = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 24,
}

const emailBtn = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  border: '1px solid #d0d7e2',
  background: '#fff',
  fontSize: 16,
  marginBottom: 12,
  cursor: 'pointer',
}

const googleBtn = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  border: '1px solid #d0d7e2',
  background: '#fff',
  fontSize: 16,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
  cursor: 'pointer',
}

const orText = {
  color: '#999',
  marginBottom: 12,
}

const input = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  border: '1px solid #d0d7e2',
  fontSize: 16,
  marginBottom: 16,
}

const confirmBtn = {
  width: '100%',
  padding: 14,
  borderRadius: 10,
  border: 'none',
  background: '#dbe3ff',
  color: '#fff',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
}

const policy = {
  fontSize: 12,
  color: '#666',
  marginTop: 16,
}

const link = {
  color: '#1a4fff',
  cursor: 'pointer',
}