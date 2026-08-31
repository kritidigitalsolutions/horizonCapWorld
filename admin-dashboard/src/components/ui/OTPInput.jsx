import React, { useState } from 'react';

export default function OTPInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(Array(length).fill(''));

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < length - 1) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }

    if (newOtp.every(d => d !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    if (newOtp.every(d => d !== '') && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(e.target.value, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-200 rounded-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none transition-all"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      ))}
    </div>
  );
}
